import { Request, Response, Router, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from "../connection/blogPSQL"
import { getUserById } from './users'

import Joi from 'joi'
export const blogSchema = Joi.object({
  //user_id: Joi.number().required(),
  title: Joi.string().min(2).max(200).required(),
  author: Joi.string().min(2).max(200).required(),
  url: Joi.string().min(8).max(300).required(),
  likes: Joi.number()
})

declare module 'jsonwebtoken' {
    export interface UserIDJwtPayLoad extends jwt.JwtPayload{
        name: string,
        user_id: number
    }
}

//this is a mess..
const getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    type queryReturnType = {
        user: string,
        blog_id: number,
        user_id: number,
        title: string,
        author: string,
        url: string,
        likes: number
    }

    interface responseObject {
        [x: string]: Array<blogType>;
    }

    type blogType = {
        blog_id: number,
        user_id: number,
        title: string,
        author: string,
        url: string,
        likes: number
    }
    
    pool.query(
        'SELECT users.name AS user, blog.blog_id, blog.user_id, blog.title, blog.author, blog.url, blog.likes' +
        '   FROM users, blog' +
        '   WHERE blog.user_id = users.user_id;',
        (error, results) => {
            if (error){
                return next(error)
            }

            const queryResults: Array<queryReturnType> = results.rows

            const formattedResponse: responseObject = {}
            const formattedResponseArray = []

            //create json
            queryResults.map(table => {
                const blog = {
                    blog_id: table.blog_id,
                    user_id: table.user_id,
                    title: table.title,
                    author: table.author,
                    url: table.url,
                    likes: table.likes
                }
                if(formattedResponse[table.user]){
                    formattedResponse[table.user].push(blog)
                } else {
                    formattedResponse[table.user] = [blog]
                }
            })

            //format json to json array
            Object.keys(formattedResponse).forEach((key, index) => {
                formattedResponseArray.push({name: key, blogs:formattedResponse[key]})
            })

            return res.status(200).json(formattedResponseArray)
        }
    )
}


const getBlogById = async (getId: number, req: Request, res: Response, next: NextFunction) => {
    if (isNaN(getId)){
        return res.status(400).json({"error": "id param was NaN"})
    }

    pool.query(`select * from blog where blog_id=${getId}`,
            (error, results) => {
                if (error){
                    return next(error)
                }

                if (results.rows.length === 0){
                    return res.status(200).json({"error": `blog with id ${getId} does not exist`})
                }

                return res.status(200).json(results.rows[0])
            }
    )
}

const getBlogByAuthor = async (getAuthor: string, req: Request, res: Response, next: NextFunction) => {
    pool.query(`select * from blog where blog.author='${getAuthor}';`,
            (error, results) => {
                if (error){
                    return next(error)
                }

                if (results.rows.length === 0){
                    return res.status(200).json({"error": `blog with author ${getAuthor} does not exist`})
                }

                return res.status(200).json(results.rows)
            }
    )
}


const postBlog = async (req: Request, res: Response, next: NextFunction) => {
    const blog = blogSchema.validate(req.body)

    let decodedToken: jwt.UserIDJwtPayLoad

    try {
        decodedToken = <jwt.UserIDJwtPayLoad>jwt.verify(req.token, process.env.SECRET)
    } catch (error) {
        return next(error)
    }

    //middleware userExtractor needs to work with tokenextractor and other stuff
    //using middleware for user extraction makes things unnecesarily complicated
    //const user = req.user
    const user = await getUserById(decodedToken.user_id)

    if (blog.error) {
      return next(blog.error)
    }

    pool.query(
        'INSERT INTO blog(user_id, title, author, url) ' +
        'VALUES ($1, $2, $3, $4) ' +
        'RETURNING blog_id, user_id, title, author, url, likes',
        [user.user_id, blog.value.title, blog.value.author, blog.value.url],
        (error, results) => {
            if (error) {
                return next(error)
            }

            return res.status(200).json(results.rows[0])
        }
    )
}


const deleteBlogById = async (deleteId: number, req: Request, res: Response, next: NextFunction) => {
    if (isNaN(deleteId)){
        return res.status(400).json({"error": "id param was NaN"})
    }

    let decodedToken: jwt.UserIDJwtPayLoad
    try {
        decodedToken = <jwt.UserIDJwtPayLoad>jwt.verify(req.token, process.env.SECRET)
    } catch (error) {
        return next(error)
    }

    const user = await getUserById(decodedToken.user_id)

    pool.query(
        'DELETE FROM blog WHERE blog_id=$1 AND user_id=$2',
        [deleteId, user.user_id],
        (error, results) => {
            if (error){
                return next(error)
            }


            //because db doesnt return a reason why something was not done its hard make a good response
            //it could be possible if blog id exists or not but its another query just for response message
            if (results.rowCount === 1){
                res.status(200).json({"message": `blog with id=${deleteId} deleted!`})
            } else {
                res.status(500).json({"message": "Wrong id, user auth error, or db error... good luck"})
            }
        }
    )
}


export const blogsRouter = Router()

blogsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    getBlogs(req, res, next)
})

blogsRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
    postBlog(req, res, next)
})

blogsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    const getId = parseInt(req.params.id)
    getBlogById(getId, req, res, next)
})

blogsRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    const deleteId = parseInt(req.params.id)
    deleteBlogById(deleteId, req, res, next)
})

blogsRouter.get('/author/:author', (req: Request, res: Response, next: NextFunction) => {
    const getAuthor = req.params.author
    getBlogByAuthor(getAuthor, req, res, next)
})