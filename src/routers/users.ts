import { Request, Response, Router, NextFunction } from 'express';
import { pool } from "../connection/blogPSQL";

import Joi from 'joi'
const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(4).max(300)
})


const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    pool.query('SELECT users.user_id AS user_id, users.name AS name FROM users;',
        (error, results) => {
            if (error){
                return next(error)
            }

            return res.status(200).json(results.rows)
        }
    )
}


export const usersRouter = Router()

usersRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    getUsers(req, res, next)
})