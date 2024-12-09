import httpMocks from 'node-mocks-http';
import * as productHandlers from './products.handler';
import { Product, ProductStore } from '../models/ProductStore';
import { PoolClient } from 'pg';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import color from 'colors/safe';

const testProducts: Product[] = [
  { id: 1, name: 'product1', price: 1000, category: 'cat1' },
  { id: 2, name: 'product2', price: 2000, category: 'cat2' },
  { id: 3, name: 'product3', price: 1500, category: 'cat1' },
  { id: 4, name: 'product4', price: 2000, category: 'cat2' },
  { id: 5, name: 'product5', price: 3000, category: 'cat1' },
];

let mockedCreateProduct: jest.SpyInstance<
  Promise<Product>,
  [product: Product, poolClient?: PoolClient],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

let mockedListProducts;
let mockedGetMostPopularProducts: jest.SpyInstance<
  Promise<{ product_id: number; order_count: number; item_count: number }[]>,
  [limit?: number, category?: string, poolClient?: PoolClient],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockedGetProduct: jest.SpyInstance<Promise<Product>, [id: number], any>;
let mockedFilterProducts: jest.SpyInstance<
  Promise<Product[]>,
  [product: Product],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

let mockedRequest: Request<
  ParamsDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  ParsedQs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any>
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockedResponse: Response<any, Record<string, any>>;

function setMocks() {
  mockedCreateProduct = jest.spyOn(ProductStore.prototype, 'createProduct');
  mockedGetProduct = jest.spyOn(ProductStore.prototype, 'getProduct');
  mockedListProducts = jest.spyOn(ProductStore.prototype, 'listProducts');
  mockedFilterProducts = jest.spyOn(ProductStore.prototype, 'filterProducts');
  mockedGetMostPopularProducts = jest.spyOn(
    ProductStore.prototype,
    'getMostPopular'
  );
  mockedRequest = httpMocks.createRequest();
  mockedResponse = httpMocks.createResponse();
}

function resetMocks() {
  mockedCreateProduct.mockClear();
  mockedGetProduct.mockClear();
  mockedListProducts.mockClear();
  mockedFilterProducts.mockClear();
  mockedGetMostPopularProducts.mockClear();
  jest.resetAllMocks();
}
describe('API Handler: products', () => {
  // --

  describe('createProduct', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });

    it("should return a 400 if request.body does not have 'price'", async () => {
      console.info(
        color.bgYellow(
          color.bold(
            ' ### CRASH TEST DUMMY: Expecting an error here: invalid product - missing price '
          )
        )
      );
      mockedRequest.body = { name: 'abc' } as Product;

      await productHandlers.createProduct(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(400);
    });

    it("should return a 400 if request.body does not have 'name'", async () => {
      console.info(
        color.bgYellow(
          color.bold(
            ' ### CRASH TEST DUMMY: Expecting an error here: invalid product -- missing name '
          )
        )
      );
      mockedRequest.body = { price: 5 } as Product;

      await productHandlers.createProduct(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(400);
    });

    it('should return a product record if inputs are good', async () => {
      const product = testProducts[0];

      mockedCreateProduct.mockResolvedValue(product);
      mockedRequest.body = product;
      mockedResponse.json = jest.fn();

      await productHandlers.createProduct(mockedRequest, mockedResponse);

      expect(mockedResponse.json).toHaveBeenCalledWith(product);
    });
  });

  describe('listProducts', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });

    it('should return a list of defined products', async () => {
      mockedListProducts.mockResolvedValue(testProducts);

      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      res.json = jest.fn();

      // API Handler users::listUsers will call the UserStore.listUsers()
      // method which has been mocked to return an array of users.
      await productHandlers.listProducts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith(testProducts);
    });
  });

  describe('lookupProducts', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });

    it('should return 1 product for given product id', async () => {
      const product: Product = testProducts[0];

      // mockedGetProduct.mockImplementation(() => Promise.resolve(product));
      mockedGetProduct.mockResolvedValue(product);

      mockedRequest.query.id = (product.id as number).toString();
      mockedResponse.json = jest.fn();

      await productHandlers.listProducts(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith([product]);
    });

    it('should return array of 1 product for given product name', async () => {
      const product: Product = testProducts[0];

      mockedFilterProducts.mockResolvedValue([product]);

      mockedRequest.query.name = product.name;
      mockedResponse.json = jest.fn();

      await productHandlers.listProducts(mockedRequest, mockedResponse);

      expect(mockedFilterProducts).toHaveBeenCalledWith({
        name: product.name,
        id: 0,
        price: 0,
        category: null,
      } as unknown as Product);
      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith([product]);
    });

    it('should return array of 3 products for given category in testData', async () => {
      const products = [testProducts[0], testProducts[2], testProducts[4]];

      mockedFilterProducts.mockResolvedValue(products);

      mockedRequest.query.category = products[0].category;
      mockedResponse.json = jest.fn();

      await productHandlers.listProducts(mockedRequest, mockedResponse);

      expect(mockedFilterProducts).toHaveBeenCalledWith({
        category: products[0].category,
        name: undefined,
        id: 0,
        price: 0,
      } as unknown as Product);
      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith(products);
    });

    it('should return array of 2 products for given price in testData', async () => {
      const products = [testProducts[2], testProducts[4]];

      mockedFilterProducts.mockResolvedValue(products);

      mockedRequest.query.price = products[0].price.toString();
      mockedResponse.json = jest.fn();

      await productHandlers.listProducts(mockedRequest, mockedResponse);

      expect(mockedFilterProducts).toHaveBeenCalledWith({
        category: null,
        name: undefined,
        id: 0,
        price: products[0].price,
      } as unknown as Product);
      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith(products);
    });
  });

  describe('getProduct', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });

    it('should return the product by id given in querystring', async () => {
      const product: Product = testProducts[0];

      mockedGetProduct.mockResolvedValue(product);

      mockedRequest.query.id = (product.id as number).toString();
      mockedResponse.json = jest.fn();

      await productHandlers.listProducts(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith([product]);
    });
  });

  describe('getMostPopular', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });

    it("Should return list of popular items limited by 'limit' query parameter", async () => {
      const popularItems = [
        { product_id: 4, order_count: 4, item_count: 6 },
        { product_id: 1, order_count: 2, item_count: 4 },
        { product_id: 3, order_count: 3, item_count: 3 },
        { product_id: 2, order_count: 1, item_count: 2 },
        { product_id: 5, order_count: 1, item_count: 1 },
      ];
      mockedGetMostPopularProducts.mockResolvedValue(popularItems);

      mockedRequest.query.limit = '5';
      mockedResponse.json = jest.fn();

      await productHandlers.getMostPopular(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(200);
      expect(mockedResponse.json).toHaveBeenCalledWith(popularItems);
    });
  });

  describe('deleteProduct', () => {
    beforeEach(() => {
      setMocks();
    });

    afterEach(() => {
      resetMocks();
    });
    it('should return 400 as it is not implemented yet', async () => {
      productHandlers.deleteProduct(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(400);
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      setMocks();
    });
    afterEach(() => {
      resetMocks();
    });
    it('should return 400 as it is not implemented yet', async () => {
      productHandlers.updateProduct(mockedRequest, mockedResponse);

      expect(mockedResponse.statusCode).toBe(400);
    });
  });
});
