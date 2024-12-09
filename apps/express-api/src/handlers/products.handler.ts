import { Request, Response } from 'express';
import { isEmpty, isNull, isUndefined } from 'lodash';

import { Product, ProductStore } from '../models/ProductStore';

const store = new ProductStore();

export async function createProduct(req: Request, res: Response) {
  const newProduct: Product = req.body as Product;

  if (isUndefined(newProduct.name) || isUndefined(newProduct.price)) {
    console.error(
      'invalid product',
      '{ name:',
      newProduct.name,
      ', price:',
      newProduct.price,
      ' }',
    );
    res.status(400);
    res.json({ error: `new product must have "name" and "price"` });
    return;
  }

  try {
    const product: Product = await store.createProduct(newProduct);
    res.status(200);
    res.json(product);
  } catch (err) {
    res.status(400);
    res.json(err);
  }
}

export async function updateProduct(req: Request, res: Response) {
  res.status(400);
  res.send('TBD');
}

export async function deleteProduct(req: Request, res: Response) {
  res.status(400);
  res.send('TBD');
}

export async function listProducts(req: Request, res: Response) {
  if (!isEmpty(req.query)) {
    await lookupProducts(req, res);
    return;
  }
  try {
    const products: Product[] = await store.listProducts();
    res.status(200);
    res.json(products);
  } catch (err) {
    res.status(400);
    res.json(err);
  }
}

export async function getProduct(req: Request, res: Response) {
  console.log('getProduct');

  try {
    const id = parseInt(req.params.id);
    const product: Product = await store.getProduct(id);
    res.status(200);
    res.json(product);
  } catch (err) {
    res.status(400);
    res.json(err);
  }
}

export async function getMostPopular(req: Request, res: Response) {
  //console.log('getMostPopular', req.query.limit, req.query.category);

  try {
    const strLimit = req.query.limit as string;
    const limit = parseInt(strLimit);
    const category = req.query.category as string;
    const items = await store.getMostPopular(limit, category);
    res.status(200);
    res.json(items);
  } catch (err) {
    console.error('failed to fetch popular rows', err);
    throw err;
  }
}

export async function lookupProducts(req: Request, res: Response) {
  //console.log("api handler: lookupProducts");
  try {
    const product: Product = {
      id: req.query.id ? parseInt(req.query.id as string) : 0,
      name: req.query.name,
      price: req.query.price ? parseInt(req.query.price as string) : 0,
      category: req.query.category || null,
    } as Product;

    if ((product.id as number) > 0) {
      const item: Product = await store.getProduct(product.id as number);
      res.status(200);
      res.json([item]);
      return;
    }

    if (
      product.price <= 0 &&
      isNull(product.name) &&
      isNull(product.category)
    ) {
      throw new Error(
        'must have id, name,price or category to search products',
      );
    }

    const items: Product[] = await store.filterProducts(product);

    res.status(200);
    res.json(items);
  } catch (err) {
    res.status(400);
    res.json(err);
  }
}
