/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

const keystone = require('keystone');
const middleware = require('./middleware');
//const importRoutes = keystone.importer(__dirname);
const cors = require('cors');

const schema = require('../graphql/schema-compose');
const graphql = require('graphql');
const bodyParser = require('body-parser');
const graphqlExpress = require('graphql-server-express').graphqlExpress;
const graphiqlExpress = require('graphql-server-express').graphiqlExpress;
const jwt = require('express-jwt');

const User = keystone.list('User').model;
const Candidate = keystone.list('Candidate').model;
const Institution = keystone.list('Institution').model;
const Admin = keystone.list('Admin').model;
//const JWT_SECRET = require('../config').JWT_SECRET;


// Setup Route Bindings
exports = module.exports = function (app) {
	//app.graphqlSchema = schema;

	//Configure CORS -- Remove localhost in final version
	var whitelist = ['http://localhost']
	var corsOptions = {
	  origin: function (origin, callback) {
	    if (whitelist.indexOf(origin) !== -1) {
	      callback(null, true)
	    } else {
	      callback(new Error('Not allowed by CORS'))
	    }
	  }
	}

	//app.use(cors());
	//
	// Register API middleware
	// -------------------------------------------------------------------------
	//NO JWT
	//app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
	//enable cors and jwt middleware on api route
	// app.use('/graphql', cors(corsOptions), bodyParser.json(), jwt({
	app.use('/graphql', cors(), bodyParser.json(), jwt({
	// app.use('/graphql', bodyParser.json(), jwt({
	  secret: process.env.JWT_SECRET,
	  credentialsRequired: false,
	}), graphqlExpress(req => {
		//req.user is provided by jwt from the authorization header provided
		let context = {};
		if (req.user) {
			context = {
				//user: req.user ? User.findOne({ _id: req.user._id || req.user.id, version: req.user.version}) : Promise.resolve(null),
				Candidate: req.user.type==='Candidate' ?
					Candidate.findOne({ _id: req.user._id || req.user.id}) : Promise.resolve(null),
				Institution: req.user.type==='Institution' ?
					Institution.findOne({ _id: req.user._id || req.user.id}) : Promise.resolve(null),
				Admin: req.user.type==='Admin' ?
					Admin.findOne({ _id: req.user._id || req.user.id}) : Promise.resolve(null),
			}
		}
		return ({
		  schema: schema,
		  context: context
		})}
	));
	app.use('/graphiql', graphiqlExpress({
			endpointURL: '/graphql'
	}));
	// Views
	app.get('/admin', (req, res) => {res.redirect('/keystone')});
	app.get('/', (req, res) => {res.redirect('/keystone')});

	//routes for testing in development
	if (process.env.NODE_ENV == 'development') {
		/*app.all('/test', routes.views.tests.test);
		app.get('/blog/:category?', routes.views.blog);
		app.get('/blog/post/:post', routes.views.post);
		app.get('/gallery', routes.views.gallery);
		app.all('/contact', routes.views.contact);*/
	}

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
