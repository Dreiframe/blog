import { Request, Response, Router, NextFunction } from 'express'
import { pool } from "../connection/blogPSQL"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import Joi from 'joi'
const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(5).max(300)
})

type dbUserType = {
    user_id: number,
    name: string,
    password: string
}


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


export const getUserById = async (user_id: number) => {
    const user: dbUserType = await new Promise((resolve, reject) => {
        pool.query(
            'SELECT * FROM USERS WHERE users.user_id=$1',
            [user_id],
            (error, results) => {
                if (error) {
                    resolve(undefined)
                }

                if(results.rowCount > 0){
                    resolve(results.rows[0])
                } else {
                    resolve(undefined)
                }
            }
        )
    })

    if (user) {
        return user
    } else {
        return undefined
    }
}


const getUserByName = async (username: string) => {
    const doesExist: dbUserType = await new Promise((resolve, reject) => {
        pool.query(
            'SELECT * FROM USERS WHERE users.name=$1',
            [username],
            (error, results) => {
                if (error) {
                    resolve(undefined)
                }

                if(results.rowCount > 0){
                    resolve(results.rows[0])
                } else {
                    resolve(undefined)
                }
            }
        )
    })

    if (doesExist) {
        return doesExist
    } else {
        return undefined
    }
}


const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    const bodyValidation = userSchema.validate(req.body)
    const {name, password} = bodyValidation.value

    if(bodyValidation.error){
        return next(bodyValidation.error)
    }

    // get user from database, if user does not exists or db is down returning undefined
    const dbUser: dbUserType = await getUserByName(name)
    if(!dbUser){
        return res.status(401).json({"error": "invalid username or password"})
    }
    
    // check if password matches
    const passwordCorrect = await bcrypt.compare(password, dbUser.password)
    if(!passwordCorrect){
        return res.status(401).json({"error": "invalid username or password"})
    }

    // create token
    const userForToken = {
        name: dbUser.name,
        user_id: dbUser.user_id,
    }

    const token = jwt.sign(
        userForToken,
        process.env.SECRET,
        { expiresIn: 60*60 }
    )

    const testing = jwt.verify(token, process.env.SECRET)
    console.log(testing)
    
    res.status(200).json({ token, name: dbUser.name })
}


export const usersRouter = Router()

//DELETE LATER? NO PURPOSE?
usersRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    getUsers(req, res, next)
})

usersRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
    createUser(req, res, next)
})

usersRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
    loginUser(req, res, next)
})