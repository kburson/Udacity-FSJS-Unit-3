import * as path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import defaultRoute from './routes/default.route';
import userRoutes from './routes/api/users.routes';
import orderRoutes from './routes/api/orders.routes';
import productRoutes from './routes/api/products.routes';
import dashboardRoutes from './routes/api/dashboard.routes';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app: express.Application = express();

app.use(bodyParser.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/', defaultRoute);
app.use('/api', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

export const server = app.listen(port, function () {
  console.log(`starting app on: ${`${host}:${port}`}`);
});

server.on('error', console.error);
