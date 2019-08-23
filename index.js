const { GraphQLServer, PubSub } = require('graphql-yoga');
var _url = 'mongodb://localhost:27017/mydb';
var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
const pubsub = new PubSub()

function fun(root, args, context, info) {
    var pop;
    return new Promise((resolve, reject) => {
        MongoClient.connect(_url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("customers").find({ id: args.id }).toArray(function(err, result) {
                if (err) throw err;
                pop = result[0]
                resolve({ pop })
                db.close();
            }).catch((err) => {
                console.log(err, 'errrrrr')
                reject({ 'rej': err })
            })
        })
    });
}

function cnt() {
    var pop;
    return new Promise((resolve, reject) => {
        MongoClient.connect(_url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("customers").count().then((res) => {
                pop = res
                resolve({ pop });
                db.close();
            }).catch((err) => {
                console.log(err, 'errrrrr')
                reject({ 'rej': err })
            })
        })
    })
}

function insrt(r) {
    var pop;
    return new Promise((resolve, reject) => {
        MongoClient.connect(_url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            var myobj = r
            dbo.collection("customers").insertOne(myobj, function(err, res) {
                if (err) reject(err);
                resolve({ 'done': 'done' })
            })
        })
    })
}

function calll() {
    var pop;
    return new Promise((resolve, reject) => {
        MongoClient.connect(_url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection("customers").find({}).toArray(function(err, result) {

                if (err) reject(err);
                pop = result;
                resolve({ pop })
                db.close();
            });
        });
    })
}
const resolvers = {
    Query: {
        info: () => `API Working fine.`,
        feed: async(root, args, context, info) => {

            var q = await fun(root, args, context, info)
            links = [{
                id: q.pop.id,
                desc: q.pop.desc,
                url: q.pop.url
            }]
            return links;
        }
    },
    Mutation: {
        post: async(parent, args) => {
            var q = await cnt()
            const link = {
                id: `link-${q.pop}`,
                desc: args.desc,
                url: args.url
            }
            var rslt = await insrt(link)
            console.log(rslt, 'rslt')
            return link
        }
    },
    Subscription: {
        newLink: {
            subscribe: async(parent, args, { pubsub }) => {
                const channel = Math.random().toString(36).substring(2, 15)
                var p = await calll()
                setInterval(() => {
                        p.pop.forEach(element => {
                            pubsub.publish(channel, element.id)
                        })
                    }, 2000)
                    // setInterval(() => { pubsub.publish(channel, p) }, 2000)
                console.log(channel, pubsub.asyncIterator(channel), 'Channel')
                return pubsub.asyncIterator(channel)
            },
            resolve: payload => { return payload }
        },
    }
}


const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    context: { pubsub }
})
server.start(() => console.log(`server is running on PORT 4000`))