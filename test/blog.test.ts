import { test, describe } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import { app } from '../src/index'

import { getUsers, deleteUserByName } from './userTestHelper.js'

const testRequest = supertest(app)

let newUser = {
    name: 'test_user',
    password: 'test_user_password'
}

let userToken = null

describe('user tests', () => {
    test('Delete test user before creation.', async () => {
        await deleteUserByName(newUser.name)
    })

    test('POST /users #Create new account#', async () => {
        await testRequest
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('Check if new account exists in db', async () => {
        const users = await getUsers()

        const names = users.map(u => u.name)
        assert(names.includes(newUser.name))
    })

    test('POST /users #Create new account with existing name#', async () => {
        const res = await testRequest
            .post('/api/users')
            .send(newUser)
            .expect(500)
            .expect('Content-Type', /application\/json/)

        assert(res.body.error.detail == `Key (name)=(${newUser.name}) already exists.`)
    })

    test('POST /users/login #Login with invalid data', async () => {
        const res = await testRequest
            .post('/api/users/login')
            .send({name: "asdsasdasdasdasd##&&//", password: "#####123"})
            .expect(401)
            .expect('Content-Type', /application\/json/)

        assert(res.body.error == 'invalid username or password')
    })

    test('POST /users/login #Login and get token', async () => {
        const res = await testRequest
            .post('/api/users/login')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        assert.deepEqual(Object.keys(res.body), [ 'token', 'name' ])
        userToken = res.body.token
    })

})

if(true){
    describe('blog tests', () => {
        test('GET /blogs', async () => {
            const res = await testRequest
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
    
            
            res.body.forEach(blog => {
                assert.deepEqual(Object.keys(blog), [ 'name', 'blogs' ])
            })
            //
        })
    
        test('POST /blogs MALFORMED', async () => {
            const blog = {
                user_id: 1,
                title: 'test_title',
                author: 'test_author',
                url: 'test_url.com',
                MALFROM: 404
            }
    
            await testRequest
                .post('/api/blogs')
                .send(blog)
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(400)
        })
    
        let createdBlogId = undefined
    
        test('POST /blogs', async () => {
            const blog = {
                user_id: 1,
                title: 'test_title',
                author: 'test_author',
                url: 'test_url.com'
            }
    
            await testRequest
                .post('/api/blogs')
                .send(blog)
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                    createdBlogId = res.body
                    console.log('created blog id:', res.body)
                })
        })
    
        test('GET /blog/:id', async () => {
            const res = await testRequest
                .get(`/api/blogs/${createdBlogId}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)
    
            assert.deepEqual(Object.keys(res.body), [ 'blog_id', 'user_id', 'title', 'author', 'url', 'likes' ])
        })
    
        test('DELETE /blog/:id', async () => {
            await testRequest
                .delete(`/api/blogs/${createdBlogId}`)
                .expect('Content-Type', /json/)
                .expect(200)
        })
    
        test('POST /blogs x 3 for author tests..', async () => {
            const blog = {
                user_id: 1,
                title: 'test_title',
                author: 'test_author',
                url: 'test_url.com'
            }
    
            await testRequest
                .post('/api/blogs')
                .send(blog)
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
    
            await testRequest
                .post('/api/blogs')
                .send(blog)
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)
    
            await testRequest
                .post('/api/blogs')
                .send(blog)
                .set('Authorization', `Bearer ${userToken}`)
                .expect('Content-Type', /json/)
                .expect(200)  
        })
    
        test('GET /blog/author/:author', async () => {
            const res = await testRequest
                .get('/api/blogs/author/test_author')
                .expect('Content-Type', /json/)
                .expect(200)
    
            assert.strictEqual(res.body.length >= 3, true)
        })
    
        test('DELETE /blog/author/author', async () => {
            const res = await testRequest
                .delete('/api/blogs/author/test_author')
                .expect('Content-Type', /json/)
                .expect(200)  
    
            assert.strictEqual(res.body.length >= 3, true)
        })
    })
}