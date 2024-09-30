import { test, after } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import { app } from '../src/index'
//import assert from 'node:assert'
//const app = require('../src/index')
//import {blogsRouter} from '../src/routers/blog'

const testRequest = supertest(app)

test('GET /blogs', async () => {
    const res = await testRequest
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

    res.body.map(blog => {
        assert.deepEqual(Object.keys(blog), [ 'blog_id', 'user_id', 'title', 'author', 'url', 'likes' ])
    })
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
        .expect('Content-Type', /json/)
        .expect(200)

    await testRequest
        .post('/api/blogs')
        .send(blog)
        .expect('Content-Type', /json/)
        .expect(200)

    await testRequest
        .post('/api/blogs')
        .send(blog)
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
