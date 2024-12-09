import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../utilities/constants';

export default function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader?.split(' ')[1]; // Authorization:['Bearer', '${token}']
    jwt.verify(token as string, TOKEN_SECRET);
    next();
  } catch (err) {
    let msg = 'Access denied, invalid auth token';
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      msg = `token validation failed: ${err.message}`;
    }
    console.error(msg);
    res.status(401); // unauthorized
    res.json(msg);
  }
}
