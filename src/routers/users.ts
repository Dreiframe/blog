import { Request, Response, Router, NextFunction } from 'express'
import { pool } from "../connection/blogPSQL"
import bcrypt from 'bcrypt'

import Joi from 'joi'
const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(5).max(300)
})

//DELETE LATER? NO PURPOSE?
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

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const user = userSchema.validate(req.body)

    if (user.error){
        return next(user.error)
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(user.value.password, saltRounds)

    pool.query(
        'INSERT INTO users(name, password)' + 
        'VALUES ($1, $2)', 
        [user.value.name, passwordHash], 
        (error, results) => {
            if (error) {
                return next(error)
            }

            return res.status(200).json({"message": "user created!"})
        })
}


export const usersRouter = Router()

//DELETE LATER? NO PURPOSE?
usersRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    getUsers(req, res, next)
})

usersRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
    createUser(req, res, next)
})