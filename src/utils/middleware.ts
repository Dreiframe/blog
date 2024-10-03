import {Request, Response, NextFunction} from 'express'

export const unknownEndpoint = (req: Request, res: Response) => {
    res.status(404).send({ "error": 'unknown endpoint' })
}

export const errorMiddleWare = (error: Error, req: Request, res: Response, next: NextFunction) => {
    //console.error(error)

    if (error.name === 'error'){
        //pg error, probably db is down
        return res.status(500).json({"error":  error})
    } else if (error.name === 'ValidationError'){
        //Joi validation error
        return res.status(400).json({"error": error.message})
    } else if (error.name === 'JsonWebTokenError'){
        //Joi validation error
        return res.status(400).json({"error": error.message})
    } else if (error.name === 'TokenExpiredError'){
        //Joi validation error
        return res.status(400).json({"error": error.message})
    }

    next(error)
}

export const tokenExtractor = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')){
        req.token = authorization.replace('Bearer ', '')
    }
    
    next()
}