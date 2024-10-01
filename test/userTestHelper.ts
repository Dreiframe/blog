import { pool } from "../src/connection/blogPSQL"


export const getUsers = async (): Promise<any> => {
    const users = await new Promise((resolve, reject) => {
        pool.query('SELECT users.user_id AS user_id, users.name AS name FROM users;',
            (error, results) => {
                if (error){
                    reject(error)
                }
    
                resolve(results.rows)
            }
        )
    })

    return users
}


export const deleteUserByName = async (name: string) => {
    const users = await new Promise((resolve, reject) => {
        pool.query(
            "DELETE FROM users WHERE name=$1;",
            [name],
            (error, results) => {
                if (error){
                    reject(error)
                }
    
                resolve(results)
            }
        )
    })

    return users
}