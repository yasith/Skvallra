// create a dictionary that will contain data relevent to the app.
$.app = {};

// attempt to retrieve the users OAuth Token from their cookie
$.app.OAuthToken = $.cookie('OAuthToken');

// set globals for user status in action
$.app._organizer = 1;
$.app._participant = 2;

$.app.client_id = "b54456c016e657c9c580";

$.app.client_secret = "56e69e9d5e6962f532db25f2b5fe1dbc6966f5ab";

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

// all users of a given action
ActionUsers = Backbone.Collection.extend({
	model: User,
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
  	url: function() {
    	return '/api/action_users/' + this.id;
  	},
});

// all action of a given user
UserActions = Backbone.Collection.extend({
	model: Action,
	initialize: function(models, options) {
    	this.id = options.id;    
  	},
	url: function() {
		return '/api/user_actions/' + this.id;
	},
});

// all user-action interactions
UserActionInteraction = Backbone.Model.extend({
	urlRoot: '/api/useractions/',
});

UserActionInteractions = Backbone.Collection.extend({
	// url: '/api/useractions/',
	model: UserActionInteraction,
	getByUserAndAction: function(user_id, action_id){
       	return this.filter(function(elem) {
          	return (elem.get("user") === user_id) && (elem.get("action") == action_id);
        })[0]
    },
    url: function() {
		return '/api/useractions/' + this.id;
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

RatingAndParticipation = Backbone.Model.extend({
	model: UserActionInteraction,
	initialize: function(models, options) {
    	this.actionId = options.id;    
  	},

  // 	methodToURL: {
  //   'read': "/api/user_actions/" + this.actionId + "/get_useraction",
  //   'create': '/api/useractions/',
  //   'update': '/api/useractions/',
  //   'delete': '/api/useractions/'
  // },

	url: function() {
		return "/api/user_actions/" + this.actionId + "/get_useraction";
	}
})

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
			imageView.$el = $('#' + this.attributes.action_id + '.actionimage');
			image.fetch({
				success: function () {
					setTimeout(function () {
						$('.actionimage').each(function () {
							var boxheight = $(this).height();
							var imgheight = $(this).children('img').height();
							var pad = (boxheight - imgheight) / 2;
							if (pad > 0) {
								$(this).children('img').css('margin-top', pad);
							};
						});
					}, 10);
				}
			});
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
		// if (model.get('id') === $.app.profile.get('id')) {
			// $('friends > .editable').hover(function() {
				// $('div.userimage').prepend("<div class='remove'>remove</div>");
			// }, function() {
				// $(this).prev('.remove').remove();
			// });
		// }
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.id + '.userimage');
			image.fetch({
				success: function () {
					setTimeout(function () {
						$('.userimage').each(function () {
							var boxheight = $(this).height();
							var imgheight = $(this).children('img').height();
							var pad = (boxheight - imgheight) / 2;
							if (pad > 0) {
								$(this).children('img').css('margin-top', pad);
							};
						});
					}, 10);
				}
			});
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
		'click .user': 'navi',
		'click .addfriend' : 'add_friend',
		'click .removefriend' : 'remove_friend'
	},
	render: function() {
		var source = $.app.templates.userSearchTemplate;
		var template = Handlebars.compile(source);

		var temp = this.collection.toJSON();

		$(temp).each(function (index, element) {
			$.ajax({
				url: '/api/users/' + element.id + '/isfriend',
				type: 'GET',
				dataType: 'json',
				async: false,
			})
			.done(function(data) {
				element.isfriend = data.status;
			});
		});

		var html = template(temp);

		this.$el.html(html);

		this.render_image();
	},
	render_image: function() {
		$(this.collection.models).each(function() {
			var image = new Images({id: this.attributes.image});
			var imageView = new ImageView({model: image});
			imageView.$el = $('#' + this.attributes.id + '.usersearchimage');
			image.fetch({
				success: function () {
					setTimeout(function () {
						$('.usersearchimage').each(function () {
							var boxheight = $(this).height();
							var imgheight = $(this).children('img').height();
							var pad = (boxheight - imgheight) / 2;
							if (pad > 0) {
								$(this).children('img').css('margin-top', pad);
							};
						});
					}, 10);
				}
			});
		});
	},
	navi: function(event) {
		if (event.currentTarget.id == $.app.user.attributes.id) {
			router.navigate("/", {trigger: true});
		} else {
			router.navigate("/" + event.currentTarget.id, {trigger: true});
		}
	},
	add_friend: function (event) {
		var friends = $.app.user.get('friends');
		friends.push(parseInt(event.currentTarget.id));
		$.app.user.save();
		this.collection.fetch();
	},
	remove_friend: function (event) {
		var friends = $.app.user.get('friends');
		var index = friends.indexOf(parseInt(event.currentTarget.id));
		friends.splice(index,1)
		// friends.push(parseInt(event.currentTarget.id));
		$.app.user.save();
		this.collection.fetch();
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
			image.fetch({
				success: function () {
					setTimeout(function () {
						$('.actionsearchimage').each(function () {
							var boxheight = $(this).height();
							var imgheight = $(this).children('img').height();
							var pad = (boxheight - imgheight) / 2;
							if (pad > 0) {
								$(this).children('img').css('margin-top', pad);
							};
						});
					}, 10);
				}
			});
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
	},
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
		this.model = new User({'first_name' : "FirstName", 'last_name' : "LastName"});
		this.render();
	},
	render: function() {

		var source = $.app.templates.profileTemplate;
		var template = Handlebars.compile(source);

		var data = this.model.attributes;
		
		var temp = this.model.toJSON()
		temp.OAuthToken = $.app.OAuthToken;

		d = new Date(temp.birthday);
		temp.birthday = d.toLocaleDateString();
		
		var html = template(temp);

		this.$el.html(html);

		this.render_image();
		this.render_friends();
		this.render_actions();
		this.render_activities();
		this.render_interests();
		var model = this.model;
		$(document).ready(function() {
			if (model.get('id') === $.app.user.get('id')) {
				$('.editable').hover(function() {
					$(this).append("<div class='edit' style='display: inline-block;'>edit</div>");
					$(this).children('.edit').click(function (event) {
						var parent = $(this).parent();
						$(this).remove();
						parent.html("<input type='text' id='editing' style='width: 100%;' value='" + $.trim(parent.text()) + "'/>");
						parent.unbind();
						// parent.unbind('mouseout');
						$('#editing').trigger('focus');
						$('#editing').blur(function (event) {
							var text = $(this).val();
							parent.html(text + " ");
							var classes = parent.attr('class');
							classes = classes.split(" ");
							classes.splice(classes.indexOf('editable'),1);
							if (classes[0] === 'birthday') {
								d = new Date(text);
								text = d.toISOString();
								$.app.user.set(classes[0], text);
								$.app.user.save();
							} else if (classes[0] === 'name') {
								var names = text.split(" ");
								var first_name = names.shift();
								var last_name = names.join(" ");
								$.app.user.set('first_name', first_name);
								$.app.user.set('last_name', last_name);
								$.app.user.save();
							} else {
								$.app.user.set(classes[0], text);
								$.app.user.save();
							}
						});
					})
				}, function() {
					$(this).children('div').remove();
				});
			};
		});
	},
	render_image: function() {
		var image = new Images({id: this.model.attributes.image});
		var imageView = new ImageView({model: image});
		imageView.$el = $('.profileimage');
		var model = this.model;
		image.fetch({
			success: function () {
				setTimeout(function () {
					var boxheight = $('.profileimage').height();
					var imgheight = $('.profileimage > img').height();
					var pad = (boxheight - imgheight) / 2;
					if (pad > 0) {
						$('.profileimage > img').css('margin-top', pad);
					};
				}, 10);
				if (model.get('id') === $.app.user.get('id')) {
					$('.profileimage').unbind();
					$('.profileimage').hover(function() {
						$(this).append("<div class='edit'>edit</div>");
						$(this).unbind('click');
						$(this).children('.edit').click(function (event) {
							// do click stuff
						});
					}, function () {
						$(this).children('.edit').remove();
					});
				}
			},
		});
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

MainView = Backbone.View.extend({
	render: function () {
		var source = $.app.templates.mainTemplate;
		var template = Handlebars.compile(source);
		var html = template({'OAuthToken': $.app.OAuthToken});
		this.$el.html(html);
	}
});

ActionStatusBarView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .rating" : "update_rating",
		"click .leave" : "remove_user",
		"click .join" : "add_user",
		"click .unlock" : "toggle_private_status",
		"click .lock" : "toggle_private_status",
	},
	render: function() {
		var source = $.app.templates.actionStatusBarTemplate;
		var template = Handlebars.compile(source);	
		var temp = this.model.toJSON();		

		var html = template(temp);
		this.$el.html(html);
		this.render_status_bar();

 	},
	remove_user: function() {
		// Remove current user from the current Action. 
		this.model.url = "/api/useractions/" + this.model.get('id');
		this.model.destroy({
			// success() does not function properly with empty responses, check statusCode instead. 
			statusCode: {
				204: function() {
					$(".leave").html("Join").switchClass("leave", "join");
					$(".rating").empty();				
				}
			},
			error: function() {
				alert("Internal error has happened while processing your request.");
			},

		});
	},
	add_user: function() {
		// Add current user to the current Action.
		var UserAction = new UserActionInteraction({
			"action": $.app.actionView.model.get('id'), 
        	"user": $.app.user.id,  
        	"role": $.app._participant,
		});
		var temp = this;
		UserAction.save({}, {
			success: function(){
				$(".join").html("Leave").switchClass("join", "leave");
				temp.draw_rating(0);
				temp.model = UserAction;
			}, 
			error: function(model, response, options) {
				var responseText = response.responseText;
				var messageStart = responseText.indexOf("\n");
				var messageEnd = responseText.indexOf("\n", messageStart + 1);
				var errorMessage = responseText.substring(messageStart, messageEnd);
				alert(errorMessage);
			},
		})
	},	
	render_status_bar: function() {
		// Display status bar controls: rating, public/private status, add user, and join/leave buttons. 
		if (this.model.has('action')) {
			$(".participation").html('<button type="button" class="btn btn-default leave">Leave</button>');
			var isOrganizer = this.model.get('role') == $.app._organizer;
			if (isOrganizer) {
				var actionPublicStatus = $.app.actionView.model.get('public');
				this.set_lock_icon(actionPublicStatus);
			}
			this.draw_rating(this.model.get('rating'));

		} else {
			$(".participation").html('<button type="button" class="btn btn-default join">Join</button>');
		}
	},
	toggle_private_status: function() {
		// Toggle public / private status of Action.
		var actionUpdate = new Action({id: $.app.actionView.model.get('id')});
		var temp = this;
		actionUpdate.fetch({
			success: function(){
				var newActionStatus = !actionUpdate.get('public')
				actionUpdate.save({'public': newActionStatus});
				temp.set_lock_icon(newActionStatus);
			}
		})
	},
	set_lock_icon: function(actionStatus) {
		// Display icon corresponding to the Action's public status.
		var lockIcon;
		if (actionStatus) {
			lockIcon = $('<img src="/static/skvallra/images/unlock_small.png" class="unlock" alt="unlock" />');
		} else {
			lockIcon = $('<img src="/static/skvallra/images/lock_small.png" class="lock" alt="lock" />');
		}
		$(".action_status").html(lockIcon);
	},
	draw_rating: function(score) {
		// Invoke Raty plugin to draw star rating field.
		$('.rating').raty({ 
			path: '/static/skvallra/images/raty-img', // icons directory
			hints: ["very bad", "poor", "okay", "good", "excellent"], // star hints
			cancel: true, // allow cancel rating
			cancelHint: 'Remove rating', 
			cancelPlace: 'right', // put cancel icon on the right
			score: score, // startup score
		});
	},
	update_rating: function() {
		// Update rating of the current UserAction model
		score = $(".rating input").val();
		this.model.url = "/api/useractions/" + this.model.get('id');
		this.model.save({'rating': score});
	},

});

// Backbone view to display an action
ActionView = Backbone.View.extend({
// TODO: add address on comment

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

		var start_date = new Date(temp.start_date);
		temp.start_date = start_date.toLocaleDateString();
		var end_date = new Date(temp.end_date);
		temp.end_date = end_date.toLocaleDateString();

		var html = template(temp);
		this.$el.html(html);

		this.render_image();
		this.render_tags();
		this.render_participants();
		this.render_comments();
		this.render_rating();
	},

	render_image: function() {
		var image = new Images({id: this.model.get('image')});
		var imageView = new ImageView({model: image});
		imageView.$el = $('.actionpageimage');
		image.fetch();
	},
	render_tags: function() {
		var activities = this.model.get('tags');
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
		var participants = new ActionUsers([], {id: this.model.get('id')});
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
		var comments = new ActionComments([], {id: this.model.get('action_id')}); // create collection with id 
		var commentsView = new ActionCommentsView({collection: comments}); // create view
		commentsView.$el = $('.user_comments'); // point view to element in DOM
		comments.fetch();
		commentsView.delegateEvents();
	},
	render_rating: function() {
		var actionStatusBar = new RatingAndParticipation([], {id: this.model.get('action_id')});
		var myActionStatusBarView = new ActionStatusBarView({model: actionStatusBar});
		myActionStatusBarView.$el = $(".action_status_bar");
		actionStatusBar.fetch();
		myActionStatusBarView.delegateEvents();
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

		$.app.mainView = new MainView();
		$.app.mainView.$el = $("#content");
		$.app.mainView.render();

		$.app.profileView = new ProfileView({model: $.app.profile});
		$.app.profileView.$el = $(".container");
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
			client_id: $.app.client_id,
			client_secret: $.app.client_secret,
			grant_type: "password",
			username: username,
			password: password,
		}
	}).done(function (data) {
		// Store the OAuth Token
		$.app.OAuthToken = data.access_token;
		$.cookie("OAuthToken", $.app.OAuthToken);
		// remove the login form
		// $(".login").remove();
		// remove the blur filter from the behind content
		// $(".container").css("-webkit-filter", "");
		// add the logout button
		$("#logo").after('<ul class="nav navbar-nav navbar-right" id="logout"><li><a class="navbar-link" href="/logout">Logout</a></li></ul>');
		// reload the users profile
		// router.show_profile();
		// $.app.profile.fetch();
		$('.container').css({"-webkit-animation-fill-mode": "forwards", "-webkit-animation-duration" : "1s", "-webkit-animation-name": "unblur"});
		$('.login').css({"-webkit-animation-fill-mode": "forwards", "-webkit-animation-duration" : "1s", "-webkit-animation-name": "fade"});
		$.app.profileView.model = $.app.profile;
		$.app.profile.fetch();

	});
}

$.app.register = function () {
	var username = $('#username').val();
	var email = $('#email').val();
	var password = $('#password').val();
	var passwordconfirm = $('#passwordconfirm').val();
	var fname = $('#fname').val();
	var lname = $('#lname').val();
	if (password != passwordconfirm) {
		return false;
	}
	var d = new Date();
	var user = new Profile({'username' : username, 'email' : email, 'password' : password, 'first_name' : fname, 'last_name' : lname, 'birthday' : d.toISOString()});
	user.save({}, {success: function () {
		$.app.authenticate();
	}});
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
					"userSearchTemplate", "commentList", "mainTemplate", "actionStatusBarTemplate"];

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
