import { ProductStore, Product } from './ProductStore';
import { filter } from 'lodash';
import { pool } from '../database';

import {
  TestDataService,
  productCategories,
} from '../_test-helpers/testDataService';

const testDataService = TestDataService.Instance;

const store = new ProductStore();

beforeAll(async () => {
  console.debug('-- ProductStore: beforeAll - generate test data');
  await testDataService.generateStaticTestData();
  console.debug('-- Test Data is loaded');
});

afterAll(async () => {
  console.debug('-- ProductStore: afterAll - delete test data');
  await testDataService.deleteTestData();
  jest.resetAllMocks();
  // jest seems to instantiate an entirely new connection pool for every test suite.
  console.debug('-- Ending the DB connection pool');
  pool.end();
});

describe('Model: ProductStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createProduct', () => {
    it('should return created product record with id', async () => {
      const productDef: Product = {
        name: 'new product',
        price: 2799,
        category: productCategories.garden,
      };

      const result = await store.createProduct(productDef);

      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toEqual(productDef.name);

      store.deleteProduct(result.id);
    });
  });

  describe('listProducts', () => {
    it('should return array of product records', async () => {
      const list = await store.listProducts();
      if (list.length !== testDataService.testData.products.length) {
        console.debug('!!!!! Test Error: product list:\n', list);
      }
      expect(list).toHaveLength(testDataService.testData.products.length);
    });
  });

  describe('getProduct', () => {
    it('should return product record for given id', async () => {
      const product = testDataService.testData.products[0];

      const item = await store.getProduct(product.id);

      expect(item.name).toEqual(product.name);
    });
  });

  describe('filterProducts', () => {
    it('should return list of products for the given category', async () => {
      const category = productCategories.hardware;
      const list = await store.filterProducts({
        category: category,
      } as Product);

      const filteredRows = filter(testDataService.testData.products, {
        category: category,
      });

      expect(list).toHaveLength(filteredRows.length);
    });

    it('should return list of products for the given price', async () => {
      const product = testDataService.testData.products[2];
      const filteredData = filter(testDataService.testData.products, {
        price: product.price,
      });

      const filteredResults = await store.filterProducts({
        price: product.price,
      } as Product);

      //console.debug('filtered products:\n', filteredResults, filteredData);

      expect(filteredResults).toHaveLength(filteredData.length);
    });
  });

  describe('getMostPopular', () => {
    it('should return list of products with order and product quantities', async () => {
      const list = await store.getMostPopular();

      //console.debug('popular products', list);
      expect(list).toHaveLength(8);
      expect(list[0].order_count).toEqual(6); // product added to 6 different orders
      expect(list[0].item_count).toEqual(8); // 8 of this product purchased across 6 orders
    });

    it('should return list of 3 products with order and product quantities', async () => {
      const limit = 3;

      const list = await store.getMostPopular(limit);

      expect(list).toHaveLength(limit);
      expect(list[0].order_count).toEqual(6);
      expect(list[0].item_count).toEqual(8);
    });
  });
});
