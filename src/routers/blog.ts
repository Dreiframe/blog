import { Request, Response, Router, NextFunction } from 'express'
import { pool } from "../connection/blogPSQL"

import Joi from 'joi'
const blogSchema = Joi.object({
  user_id: Joi.number().required(),
  title: Joi.string().min(2).max(200).required(),
  author: Joi.string().min(2).max(200).required(),
  url: Joi.string().min(8).max(300).required(),
  likes: Joi.number()
})


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


// USER AUTHENTICATION REQUIREMENTS MISSING ! TODO !
const postBlog = async (req: Request, res: Response, next: NextFunction) => {
    const blog = blogSchema.validate(req.body)

    if (blog.error) {
      return next(blog.error)
    }

    pool.query(
        'INSERT INTO blog(user_id, title, author, url) ' +
        'VALUES ($1, $2, $3, $4) ' +
        'RETURNING blog_id',
        [blog.value.user_id, blog.value.title, blog.value.author, blog.value.url],
        (error, results) => {
            if (error) {
                return next(error)
            }

            return res.status(200).json(results.rows[0].blog_id)
        }
    )
}

// USER AUTHENTICATION REQUIREMENTS MISSING ! TODO !
const deleteBlogById = async (deleteId: number, req: Request, res: Response, next: NextFunction) => {
    if (isNaN(deleteId)){
        return res.status(400).json({"error": "id param was NaN"})
    }

    pool.query(`delete from blog where blog_id=${deleteId}`,
            (error, results) => {
                if (error){
                    return next(error)
                }

                return res.status(200).json(results.rows[0])
            }
    )
}

// USER AUTHENTICATION REQUIREMENTS MISSING ! TODO !
const deleteBlogsByAuthor = async (deleteAuthor: string, req: Request, res: Response, next: NextFunction) => {
    pool.query(`delete from blog where blog.author='${deleteAuthor}' returning *`,
            (error, results) => {
                if (error){
                    return next(error)
                }

                return res.status(200).json(results.rows)
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

blogsRouter.delete('/author/:author', (req: Request, res: Response, next: NextFunction) => {
    const deleteAuthor = req.params.author
    deleteBlogsByAuthor(deleteAuthor, req, res, next)
})