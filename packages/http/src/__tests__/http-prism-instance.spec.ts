import { IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types/http-spec';
import { omit } from 'lodash';
import { relative, resolve } from 'path';
import { createInstance, IHttpConfig, IHttpRequest, IHttpResponse } from '../';

describe('Http Prism Instance function tests', () => {
  let prism: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, { path: string }>;

  beforeAll(async () => {
    prism = createInstance();
    await prism.load({
      path: relative(
        process.cwd(),
        resolve(__dirname, 'fixtures', 'no-refs-petstore-minimal.oas2.json')
      ),
    });
  });

  test('given incorrect route should throw error', () => {
    return expect(
      prism.process({
        method: 'get',
        url: {
          path: '/invalid-route',
        },
      })
    ).rejects.toThrowError('Route not resolved, none path matched');
  });

  test('given correct route should return correct response', async () => {
    const response = await prism.process({
      method: 'get',
      url: {
        path: '/pet/findByStatus',
        query: {
          status: ['available', 'pending'],
        },
      },
    });
    const parsedBody = JSON.parse(response!.output!.body);
    expect(parsedBody.length).toBeGreaterThan(0);
    parsedBody.forEach((element: any) => {
      expect(typeof element.name).toEqual('string');
      expect(Array.isArray(element.photoUrls)).toBeTruthy();
      expect(element.photoUrls.length).toBeGreaterThan(0);
    });
    // because body is generated randomly
    expect(omit(response, 'output.body')).toMatchSnapshot();
  });

  test('given route with invalid param should return a validation error', async () => {
    const response = await prism.process({
      method: 'get',
      url: {
        path: '/pet/findByStatus',
      },
    });
    expect(response).toMatchSnapshot();
  });

  test('should support collection format multi', async () => {
    const response = await prism.process({
      method: 'get',
      url: {
        path: '/pet/findByStatus',
        query: {
          status: ['sold', 'available'],
        },
      },
    });
    expect(response.validations).toEqual({
      input: [],
      output: [],
    });
  });

  test('support param in body', async () => {
    const response = await prism.process({
      method: 'post',
      url: {
        path: '/store/order',
      },
      body: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '12-01-2018',
        status: 'placed',
        complete: true,
      },
    });
    expect(response.validations).toEqual({
      input: [],
      output: [],
    });
  });
});