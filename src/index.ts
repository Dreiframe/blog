import express, { Express, json } from "express"
import cors from 'cors'

declare global{
  namespace Express {
    export interface Request {
        token: string
    }
  }
}

const app: Express = express()
app.use(json())
app.use(cors())


import morgan from 'morgan'
app.use(morgan('tiny'))

import { tokenExtractor } from "./utils/middleware"
app.use(tokenExtractor)

import { blogsRouter } from "./routers/blog"
app.use('/api/blogs', blogsRouter)

import { usersRouter } from "./routers/users"
app.use('/api/users', usersRouter)


import { errorMiddleWare, unknownEndpoint } from "./utils/middleware"
app.use(unknownEndpoint)
app.use(errorMiddleWare)

import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export {app}