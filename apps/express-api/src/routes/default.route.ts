import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  /*
  #swagger.summary = 'Default server path'
  #swagger.responses[200] = {
    description: "Brief description of the API server",
    content: {
      "text/plain": {
        "schema": {"type": "string"}
      }
    }
  }
  */
  res.status(200);
  res.send(
    'This is an api server for the full stack developer course on udacity.',
  );
});

export default router;
