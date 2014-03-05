// create a dictionary that will contain data relevent to the app.
$.app = {};

// attempt to retrieve the users OAuth Token from their cookie
$.app.OAuthToken = $.cookie('OAuthToken');

// add needed functionality to all jquery ajax calls
$.ajaxSetup({
	beforeSend: function (xhr, settings)
	{
		// fixes a potential jquery ajax bug where headers are not always added to a request
		if (settings.url.indexOf("/", settings.url.length - 1) == -1) {
			settings.url += "/";
		}

		// add the Authorization header with the OAuth Token to the request.
		if ($.app.OAuthToken) {
			xhr.setRequestHeader("Authorization","Bearer " + $.app.OAuthToken);
		}
	}
});

//
// javascript models and collections to correspond with the matching django models
//

SearchUser = Backbone.Collection.extend({
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
	url: function() {
		return "/api/search/" + this.id + "/users/";
	},
});

SearchAction = Backbone.Collection.extend({
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
	url: function() {
		return "/api/search/" + this.id + "/actions/";
	},
});

User = Backbone.Model.extend({
	urlRoot: '/api/users/',
});

Users = Backbone.Collection.extend({
	model: User,
	url: "/api/users/",
});

Activity = Backbone.Model.extend({
	urlRoot: "/api/tags/",
});

Activities = Backbone.Collection.extend({
	model: Activity,
	url: "/api/tags/",
});

Images = Backbone.Model.extend({
	urlRoot: '/api/images/'
});

Profile = Backbone.Model.extend({
	initialize: function() {
		this.on('sync', this.record, this);
	},
	urlRoot: '/api/me/',
	// keep a copy of the current user's object in the app
	record: function() {
		$.app.user = this;
	}
});

ProfileList = Backbone.Collection.extend({
	model: Profile,
	url: "/api/me/",
});

Action = Backbone.Model.extend({
	urlRoot: '/api/actions/',
});

ActionUsers = Backbone.Collection.extend({
	model: User,
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
  	url: function() {
    	return '/api/action_users/' + this.id;
  	},
});


UserActions = Backbone.Collection.extend({
	model: Action,
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
	url: function() {
		return '/api/user_actions/' + this.id;
	},
});

Setting = Backbone.Model.extend({
	urlRoot: '/api/settings/',
});

Settings = Backbone.Collection.extend({
	model: Setting,
	url: "/api/settings/",
});

Comment = Backbone.Model.extend({
	urlRoot: '/api/comments/',
});

ActionComment = Backbone.Model.extend({
	urlRoot: '/api/action_comments/',
});

ActionComments = Backbone.Collection.extend({
	model: ActionComment,
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
  	url: function() {
    	return '/api/action_comments/' + this.id;
  	},
});


// Backbone view to display a list of Activities
ActivitiesView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);
	},	
	render: function() {
		var source = $.app.templates.activitiesList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());
		this.$el.html(html);
	}
});

// Backbone view to display a list of Actions
ActionListView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .action" : "navi",
	},
	render: function() {
		var source = $.app.templates.actionList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());

		this.$el.html(html);

		this.render_image();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.action_id + '.userimage');
			image.fetch();
		});
	},
	navi: function(event) {
		router.navigate("/action/" + event.currentTarget.id, {trigger: true});
	}
});

// Backbone view to display the list of comments
ActionCommentsView = Backbone.View.extend({
	initialize: function() {
		// bind parents render_comments function to change event
		this.collection.on('change', $.app.actionView.render_comments, $.app.actionView);
		// bind render function to sync event
		this.collection.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click #add_comment": "add_comment",
	},
	render: function() {
		var source = $.app.templates.commentList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());
		this.$el.html(html);
	},
	add_comment: function(event) {
		var NewComment = new Comment({
			"action_id": $(".title").get(0).id, 
        	"user_id": $.app.user.id,  
        	"comment_time": new Date().toISOString(), 
        	"comment": $("#new_comment").val(),
		});
		this.collection.add(NewComment);
		NewComment.save();
	},
})

// Backbone view to display a list of users
ActionFriendListView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);

	},
	events: {
		// event, element and function to bind together
		"click .friend": "navi",
	},
	render: function() {
		var source = $.app.templates.friendList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());

		this.$el.html(html);

		this.render_image();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.id + '.userimage');
			image.fetch();
		});
	},
	navi: function(event) {
		if (event.currentTarget.id == $.app.user.attributes.id) {
			router.navigate("/", {trigger: true});
		} else {
			router.navigate("/" + event.currentTarget.id, {trigger: true});
		}
	}
});

// Backbone view to display an image
ImageView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	render: function() {
		var source = $.app.templates.imageTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());

		this.$el.html(html);
	}
});

// Backbone view to display the list of user search results
SearchUserView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .user": "navi",
	},
	render: function() {
		var source = $.app.templates.userSearchTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());

		this.$el.html(html);

		this.render_image();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.id + '.usersearchimage');
			image.fetch();
		});
	},
	navi: function(event) {
		if (event.currentTarget.id == $.app.user.attributes.id) {
			router.navigate("/", {trigger: true});
		} else {
			router.navigate("/" + event.currentTarget.id, {trigger: true});
		}
	},
});

// Backbone view to display the list of action search results
SearchActionView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .search-action": "navi",
	},
	render: function() {
		var source = $.app.templates.actionSearchTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());

		this.$el.html(html);

		this.render_image();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.action_id + '.actionsearchimage');
			image.fetch();
		});
	},
	navi: function(event) {
		router.navigate("/action/" + event.currentTarget.id, {trigger: true});
	}
});

// Backbone view to display the search results page
SearchView = Backbone.View.extend({
	initialize: function(options) {
		this.searchterm = options.searchterm;
	},
	render: function() {
		var source = $.app.templates.searchTemplate;
		var template = Handlebars.compile(source);
		var html = template({});

		this.$el.html(html);

		var userSearch = new SearchUser([], {id: this.searchterm});
		var searchUserView = new SearchUserView({collection: userSearch});
		searchUserView.$el = $('#users');
		userSearch.fetch();
		searchUserView.delegateEvents();

		var actionSearch = new SearchAction([], {id: this.searchterm});
		var searchActionView = new SearchActionView({collection: actionSearch});
		searchActionView.$el = $('#actions');
		actionSearch.fetch();
		searchActionView.delegateEvents();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.id + '.usersearchimage');
			image.fetch();
		});
	}
});

// Backbone view to display a users profile
ProfileView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
		// bind error function to error event
		this.model.on('error', this.error, this);
	},
	error: function() {
		// if a user is not logged in, use an empty user object as the model to display
		// an empty user object is used since the login form is displayed overtop of the
		// profile view
		this.model = new User({});
		this.render();
	},
	render: function() {
		var source = $.app.templates.profileTemplate;
		var template = Handlebars.compile(source);

		var data = this.model.attributes;
		
		var temp = this.model.toJSON()
		temp.OAuthToken = $.app.OAuthToken;
		
		var html = template(temp);

		this.$el.html(html);

		this.render_image();
		this.render_friends();
		this.render_actions();
		this.render_activities();
		this.render_interests();
	},
	render_image: function() {
		var image = new Images({id: this.model.attributes.image});
		var imageView = new ImageView({model: image});
		imageView.$el = $('.profileimage');
		image.fetch();
	},
	render_friends: function() {
		var friends = this.model.attributes.friends;
		var users = new Users();
		var actionFriendListView = new ActionFriendListView({collection: users});
		actionFriendListView.$el = $('.friends');
		$(friends).each(function() {
			var user = new User({id: this.valueOf()});
			users.add(user);
			user.fetch();
		});
		actionFriendListView.delegateEvents();
	},
	render_actions: function() {
		var actions = new UserActions([], {id: this.model.attributes.id});
		var actionListView = new ActionListView({collection: actions});
		actionListView.$el = $('.actions');
		actions.fetch();
		actionListView.delegateEvents();
	},
	render_activities: function() {
		var activities = this.model.attributes.activities;
		var acts = new Activities();
		var activitiesView = new ActivitiesView({collection: acts});
		activitiesView.$el = $('.activities');
		$(activities).each(function() {
			var act = new Activity({id: this.valueOf()});
			acts.add(act);
			act.fetch();
		});
	},
	render_interests: function() {
		var activities = this.model.attributes.interests;
		var acts = new Activities();
		var activitiesView = new ActivitiesView({collection: acts});
		activitiesView.$el = $('.interests');
		$(activities).each(function() {
			var act = new Activity({id: this.valueOf()});
			acts.add(act);
			act.fetch();
		});
	}
});

// Backbone view to display an action
ActionView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	render: function() {
			var source = $.app.templates.actionTemplate;
			var template = Handlebars.compile(source);
				
			var temp = this.model.toJSON();
			temp.member = true;
			if ($.app.actions.indexOf(this.model.attributes.action_id) == -1) {
				temp.member = false;
			}
			var html = template(temp);
			this.$el.html(html);

			this.render_image();
			this.render_tags();
			this.render_participants();
			this.render_comments();
		},
	render_image: function() {
		var image = new Images({id: this.model.attributes.image});
		var imageView = new ImageView({model: image});
		imageView.$el = $('.actionimage');
		image.fetch();
	},
	render_tags: function() {
		var activities = this.model.attributes.tags;
		var acts = new Activities();
		var activitiesView = new ActivitiesView({collection: acts});
		activitiesView.$el = $('.tags');
		$(activities).each(function() {
			var act = new Activity({id: this.valueOf()});
			acts.add(act);
			act.fetch();
		});
	},
	render_participants: function(){
		var participants = new ActionUsers([], {id: this.model.attributes.id});
		participants.fetch({success: function(){
			var users = new Users();
			var actionFriendListView = new ActionFriendListView({collection: users});
			actionFriendListView.$el = $('.users');
			participants.each(function(m) {
				var user = new User({id: m.get("id")});
				users.add(user);
				user.fetch();
			});
			actionFriendListView.delegateEvents();
		}});
	},
	render_comments: function() {
		var comments = new ActionComments([], {id: this.model.attributes.action_id}); // create collection with id 
		var commentsView = new ActionCommentsView({collection: comments}); // create view
		commentsView.$el = $('.user_comments'); // point view to element in DOM
		comments.fetch();
		commentsView.delegateEvents();
	},
});

// Backbone view to display the settings page
SettingsView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	render: function() {
		var source = $.app.templates.settingsTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());
		this.$el.html(html);
	},
});

// Backbone router to allow for navigation though the app
// and to allow for urls within the app even though it is
// a single page and navigated completely through javascript
Router = Backbone.Router.extend({
	routes: {
		"": "show_profile",
		"suggested": "show_suggested",
		"nearby": "show_nearby",
		"settings": "show_settings",
		"logout": "logout",
		"action/:id": "show_action",
		"search/:term": "show_search",
		"activities/:term": "show_activities",
		"interests/:term": "show_interests",
		":id": "show_profile",
		"action/:id": "show_action",
	},
	show_profile: function(id) {
		$.app.profile;
		if (id) {
			$.app.profile = new User({id: id});
		} else {
			$.app.profile = new Profile();
		}

		$.ajax({
			type: "GET",
			url: "/api/user_actions/",
		}).done(function (data){
			var temp = [];
			$(data).each(function (){
				temp.push(this.action_id);
			});
			$.app.actions = temp;
		});

		$.app.profileView = new ProfileView({model: $.app.profile});
		$.app.profileView.$el = $("#content");
		$.app.profile.fetch();
	},
	show_suggested: function() {
		// TODO: display the suggested friends page
	},
	show_nearby: function() {
		// TODO: display the nearby actions page
	},
	show_settings: function() {
		var settings = new Settings();
		var settingsView = new SettingsView({model: settings});
		settingsView.$el = $("#content");
		settings.fetch();
		console.log(settings);
	},
	show_action: function(id) {
		var action = new Action({id: id});
		$.app.actionView = new ActionView({model: action});
		$.app.actionView.$el = $("#content");
		action.fetch();
	},
	show_search: function(term) {
		var searchView = new SearchView({searchterm: term});
		searchView.$el = $("#content");
		searchView.render();
	},
	show_activities: function(term) {
		// TODO: display search page with users and actions who do a specified activity
	},
	show_interests: function(term) {
		// TODO: display search page with users and actions who have a specified interest
	},
	logout: function() {
		delete $.app.OAuthToken;
		$.removeCookie("OAuthToken");
		setTimeout(function() {
			router.navigate("/", {trigger: true});
		}, 100);
	}
});

// used to authenticate a user with the system and get an OAuth Token
$.app.authenticate = function() {
	var username = $('#username').val();
	var password = $('#password').val();
	$.ajax({
		type: "POST",
		url: "/oauth2/access_token",
		data: {
			client_id: "b54456c016e657c9c580",
			client_secret: "56e69e9d5e6962f532db25f2b5fe1dbc6966f5ab",
			grant_type: "password",
			username: username,
			password: password,
		}
	}).done(function (data) {
		// Store the OAuth Token
		$.app.OAuthToken = data.access_token;
		$.cookie("OAuthToken", $.app.OAuthToken);
		// remove the login form
		$(".login").remove();
		// remove the blur filter from the behind content
		$(".container").css("-webkit-filter", "");
		// add the logout button
		$("#logo").after('<ul class="nav navbar-nav navbar-right" id="logout"><li><a class="navbar-link" href="/logout">Logout</a></li></ul>');
		// reload the users profile
		router.show_profile();
	});
}

// used to validate a user/OAuth Token, if not valid removes the token from the app
// if valid, removes the login form, and blur from behind content and adds the logout button
$.app.validate = function() {
	$.ajax({
		type: "GET",
		url: "/api/me/",
		statusCode: {
			401: function() {
				delete $.app.OAuthToken;
				$.removeCookie("OAuthToken");
				$('#logout').remove();
			},
			200: function() {
				console.log("200");
				$(".login").remove();
				$(".container").css("-webkit-filter", "");
				$("#logo").after('<ul class="nav navbar-nav navbar-right" id="logout"><li><a class="navbar-link" href="/logout">Logout</a></li></ul>');
			}
		}
	});
}

// navigates the app to the search page
$.app.search = function() {
	var searchterm = $('#searchbox').val();
	router.navigate("/search/" + searchterm, {trigger: true});
	return false;
}

// list of templates the app should load
$.app.templates = ["actionList", "actionSearchTemplate", "actionTemplate", "activitiesList", "alistItemTemplate", 
					"flistItemTemplate", "friendList", "imageTemplate", "interestsList", "loginTemplate", 
					"profileTemplate", "searchListItemTemplate", "searchTemplate", "settingsTemplate", 
					"userSearchTemplate", "commentList"];

// loads templates into the app for future use by views.
$.app.loadTemplates = function(options) {
	// create a copy of the templates list
	var temp = $.app.templates;
	// redefine templates to be a dictionary
	$.app.templates = {};
	// bind the success option to be a handler for when all ajax call are finished
	$(document).ajaxStop(options.success);
	// bind another handler that removes all handlers to clean up after ourselves
	$(document).ajaxStop(function() {
		$(document).off("ajaxStop");
	});
	// loop through each required template and load it using ajax
	// storing it in the templates dictionary
	$(temp).each(function() {
		var name = this;
		$.ajax({
			type: "GET",
			url: "/static/skvallra/templates/" + name + ".html",
		}).done(function(data) {
			var newTemplate = {};
			newTemplate[name] = data;
			// uses the underscore.js extend method to add key/value pairs
			// in newTemplate to the apps templates dictionary
			$.app.templates = _.extend($.app.templates, newTemplate);
		});
	});
};

// call the actual loadTemplates function passing a success handler
// that waits for the document to be ready before registering partial templates
// and handlers, fetching the users profile and actions to have stored in the app,
// checks the user/OAuthToken for validity, creates an instance of the router and
// starts keeping track of history.
$.app.loadTemplates({
	success: function() {
		$(document).ready(function () {
			// Register partial templates with Handlebars.js
			Handlebars.registerPartial("flistItem", $.app.templates.flistItemTemplate);
			Handlebars.registerPartial("alistItem", $.app.templates.alistItemTemplate);
			Handlebars.registerPartial("activitiesList", $.app.templates.activitiesList);
			Handlebars.registerPartial("interestsList", $.app.templates.interestsList);
			Handlebars.registerPartial("friendsList", $.app.templates.friendList);
			Handlebars.registerPartial("actionsList", $.app.templates.actionList);
			Handlebars.registerPartial("login", $.app.templates.loginTemplate);

			// bind search function to the search form
			$("#navbar-form").submit($.app.search);

			// attempt to retrieve the users profile
			var temp = new Profile();
			temp.fetch();

			// attempt to retrieve the users actions.
			$.ajax({
				type: "GET",
				url: "/api/user_actions/",
			}).done(function (data){
				var temp = []
				$(data).each(function (){
					temp.push(this.action_id);
				});
				$.app.actions = temp;

				// validate and start the app
				$.app.validate();
				router = new Router();
				Backbone.history.start({pushState: true});
			});

		});
	},
});
