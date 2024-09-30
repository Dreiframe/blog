import {Request, Response, NextFunction} from 'express'

export const unknownEndpoint = (req: Request, res: Response) => {
    res.status(404).send({ "error": 'unknown endpoint' })
}

export const errorMiddleWare = (error: Error, req: Request, res: Response, next: NextFunction) => {
    //console.error(error)

    if (error.name === 'error'){
        //pg error, probably db is down
        return res.status(500).json({"error":  error})
    }

    if (error.name === 'ValidationError'){
        //Joi validation error
        return res.status(400).json({"error": error.message})
    }

    next(error)
}