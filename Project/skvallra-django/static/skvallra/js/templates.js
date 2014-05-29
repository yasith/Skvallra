String.prototype.toProperCase = function () {
	return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

// create a dictionary that will contain data relevent to the app.
$.app = {};

// attempt to retrieve the users OAuth Token from their cookie
$.app.OAuthToken = $.cookie('OAuthToken');

// set globals for user status in action
$.app._organizer = 1;
$.app._participant = 2;

$.app.client_id = "b54456c016e657c9c580";

$.app.client_secret = "56e69e9d5e6962f532db25f2b5fe1dbc6966f5ab";

// app error messages
$.app.errors_messages = {};
$.app.errors_messages.internal_error = "An internal error has happened while processing your request.";
$.app.errors_messages.action_update_error = "An internal error has happened while processing your request. Your action was not updated.";
$.app.errors_messages.geo_error = "The address you entered is not valid. Your address will be updated but map location will not change.";
$.app.errors_messages.add_user_to_action_error = "An internal error has happened while processing your request. The user was not added to the action.";
$.app.errors_messages.remove_user_from_action_error = "An internal error has happened while processing your request. The user was not removed from the action.";

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

SearchUsersForAction = Backbone.Collection.extend({
	initialize: function(models, options) {
		this.id = options.id;    
	},
	url: function() {
		return "/api/search/" + this.id + "/invite_users/";
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
	model: UserActionInteraction,
	getByUserAndAction: function(user_id, action_id){
		return this.filter(function(elem) {
			return (elem.get("user") == user_id) && (elem.get("action") == action_id);
		})[0]
	},
	url: function() {
		return '/api/useractions/';
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

	url: function() {
		return "/api/user_actions/" + this.actionId + "/get_useraction";
	}
});

Suggested = Backbone.Collection.extend({
	url: function () {
		return '/api/suggested/';
	}
});

SuggestedView = Backbone.View.extend({
	render: function () {
		var source = $.app.templates.suggestedViewTemplate;
		var template = Handlebars.compile(source);
		var html = template({});
		this.$el.html(html);

		var suggested = new Suggested();
		var searchUserView = new SearchUserView({collection: suggested});
		searchUserView.$el = $('#users');
		suggested.fetch();
		searchUserView.delegateEvents();
	},
});

ListView = Backbone.View.extend({
	initialize: function (options) {
		this.url = options.url;
	},
	render: function () {
		var view = this;
		$.ajax({
			url: '/api/' + this.url,
			type: 'GET',
			dataType: 'json',
		})
		.done(function (data) {
			var source = $.app.templates.listViewTemplate;
			var template = Handlebars.compile(source);
			data.title = view.pretify(view.url);
			var html = template(data);
			view.$el.html(html);
		});
	},
	pretify: function (string) {
		string = string.replace(/_/g, ' ');
		string = string.toProperCase();
		return string;
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

		var model = this.model;
		var editOnHover = function () {
			$(this).children(".edit").remove();
			var divImg = $("<div class='edit pull-right'><img src='/static/skvallra/images/edit.png' id='edit_img'></div>");
			$(this).append(divImg);
			$(this).children('.edit').click(function (event) {
				var parent = $(this).parent();
				$(this).remove();

				var classes = parent.attr('class');
				classes = classes.split(" ");
				classes.splice(classes.indexOf('editable'),1);

				var parentClass = classes[0];
				parent.html("<input type='text' id='editing' style='width: 100%;' value='" + $.trim(parent.text()) + "'/>");
				$('#editing').trigger('focus');

				parent.unbind();

				$('#editing').blur(function (event) {

					parent.hover(editOnHover, function() {
						$(this).children(".edit").remove();
					});
					
					var text = ActionMainView.prototype.encodeHTML($(this).val());
					parent.html(text + " ");
					model.set(parentClass, text);
					model.save();
				});
			})
		}

		$('.editable').hover(editOnHover, function() {
			$(this).children(".edit").remove();
		});
	},
});

GraphView = Backbone.View.extend({
	initialize: function (options) {
		this.url = options.url;
	},
	render: function () {
		var view = this;
		$.ajax({
			url: '/api/' + this.url,
			type: 'GET',
			dataType: 'json',
		})
		.done(function (temp) {
			var source = $.app.templates.graphViewTemplate;
			var template = Handlebars.compile(source);
			data = {}
			data.title = view.pretify(view.url);
			data.id = view.url;
			data.elements = new Array();
			$(temp.elements).each(function(index, el) {
				data.elements.push({x: el[0], y: el[1]});
			});
			var html = template(data);
			view.$el.html(html);
		});
	},
	pretify: function (string) {
		string = string.replace(/_/g, ' ');
		string = string.toProperCase();
		return string;
	},
});

HitsView = Backbone.View.extend({
	render: function () {
		var data = {};
		data.title = "Hits Per Page";
		data.values = [];
		data.id = "hitsperpage";
		var views = ["User", "Profile", "Tag", "Action", "User_Action", "Action_User", "Image", "Setting", "ActionComment", "Comment"]
		var requests = []
		var view = this;
		$(document).ajaxStop(function () {
			var source = $.app.templates.hitsViewTemplate;
			var template = Handlebars.compile(source);
			var html = template(data);
			view.$el.html(html);
		});
		// bind another handler that removes all handlers to clean up after ourselves
		$(document).ajaxStop(function() {
			$(document).off("ajaxStop");
		});
		$(views).each(function(index, el) {
			requests.push(
			$.ajax({
				url: '/api/page_views/' + el,
				type: 'GET',
				dataType: 'json',
				sync: true,
			}).done(function (response) {
				d = [el, response];
				data.labels = [];
				$(response).each(function (index, el) {
					data.labels.push(el[0]);
				});
				data.values.push(d)
			}));
		});
	},
	pretify: function (string) {
		string = string.replace(/_/g, ' ');
		string = string.toProperCase();
		return string;
	}
})

StatisticsView = Backbone.View.extend({
	render: function() {
		var source = $.app.templates.statisticsViewTemplate;
		var template = Handlebars.compile(source);
		var html = template({});
		this.$el.html(html);

		var lists = ["settings", "number_of_users", "top_organizers", "top_tags", "top_actions"];
		var listHtml = "";
		for (var i = 0; i <= lists.length - 1; i++) {
			listHtml += '<div id="list' + i + '" class="panel panel-default"></div>';
		};
		$('.lists').html(listHtml);

		lists.splice(0,1);
		this.render_lists(lists);

		var graphs = ["actions_per_user"];
		var graphHtml = "";
		for (var i = 0; i <= graphs.length; i++) {
			graphHtml += '<div id="graph' + i + '" class="panel panel-default"></div>';
		};
		$('.graphs').html(graphHtml);

		this.render_graphs(graphs);

		this.render_settings();

	},
	render_lists: function (lists) {
		$(lists).each(function(index, el) {
			var listView = new ListView({'url': el});
			listView.$el = $('#list' + (index + 1));
			listView.render();
		});
	},
	render_graphs: function (graphs) {
		$(graphs).each(function (index, el) {
			var graphView = new GraphView({'url': el});
			graphView.$el = $('#graph' + index);
			graphView.render();
		});
		var hitsView = new HitsView();
		hitsView.$el = $('#graph' + graphs.length);
		hitsView.render();
	},
	render_settings: function() {
		var settings = new Setting({id: 1});
		var settingsView = new SettingsView({model: settings});
		settingsView.$el = $("#list0");
		settings.fetch();
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
			imageView.$el = $('#' + this.attributes.action_id + '.actionimage');			
			image.fetch();
		});
	},
	navi: function(event) {
		router.navigate("/action/" + event.currentTarget.id, {trigger: true});
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
		var renderElem = this.$el;
		this.render_thumbnail(renderElem);
	},
	render_thumbnail: function(renderElem) {
		setTimeout(function () {
			$(renderElem).each(function () {
				// dynamically calculate height and width of a thumbnail to fit in the image box;
				var childImg = $(this).children('img');
				var boxheight = $(this).height();
				var boxwidth = $(this).width();
				childImg.css({'max-width': boxwidth+'px', 'max-height':boxheight+'px'});
				
				// create the padding
				var imgheight = childImg.height();
				var imgwidth = childImg.width();
				var topPad = ImageView.prototype.get_pad(boxheight, imgheight);
				var leftPad = ImageView.prototype.get_pad(boxwidth, imgwidth);
				childImg.css({'margin-top': topPad, 'margin-left': leftPad});
			});
		}, 100);
	},
	get_pad: function(boxparam, targetparam) {
		var pad = 0;
		if (targetparam > 0) {
			pad = (boxparam - targetparam) / 2;
		}
		return pad;
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
		$.app.user.save();
		this.collection.fetch();
	},
});


// Backbone view to display the list of user search results
SearchUsersForActionView = SearchUserView.extend({
	events: {
		// event, element and function to bind together
		'click .user': 'navi',
		'click .add_user': 'add_user',
	},
	render: function() {
		var source = $.app.templates.userSearchTemplate; 
		var template = Handlebars.compile(source);
		var temp = this.collection.toJSON();
		var html = template(temp);

		this.$el.html(html);
		$(":button").remove();
		$(this.collection.models).each(function() {
			var id = this.attributes.id;
			$("#user_" + id).html('<input type="button" id="'+ id +'" class="btn btn-default pull-right add_user" value="Add User" />');
		});

		this.render_image();
	},
	add_user: function (event) {
		var userId = event.currentTarget.id;
		var userAction = new UserActionInteraction({ "action": this.id, "user": userId, "role": $.app._participant });
		userAction.save({}, {
			success: function() {
				$(".user#" + userId).parent().remove();
			},
			error: function(model, response, options) {
				alert($.app.errors_messages.add_user_to_action_error);
			}
		});
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
		"click .joinaction": "join_action",
		"click .leaveaction": "leave_action",
	},
	render: function() {
		var source = $.app.templates.actionSearchTemplate;
		var template = Handlebars.compile(source);

		var temp = this.collection.toJSON();
		$(temp).each(function (index, element) {
			$.ajax({
				url: '/api/user_actions/' + element.action_id + '/get_useraction',
				type: 'GET',
				dataType: 'json',
				async: false,
			})
			.done(function(data) {
				element.ismember = !$.isEmptyObject(data);
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
			imageView.$el = $('#' + this.attributes.action_id + '.actionsearchimage');
			image.fetch();
		});
	},
	navi: function(event) {
		router.navigate("/action/" + event.currentTarget.id, {trigger: true});
	},
	join_action: function (event) {
		var action_id = parseInt(event.currentTarget.id);
		var user_id = $.app.user.get('id');
		var userAction = new UserActionInteraction({'user': user_id, 'action': action_id, 'role': $.app._participant});
		userAction.save();
		this.collection.fetch();
	},
	leave_action: function (event) {
		var action_id = parseInt(event.currentTarget.id);

		$.ajax({
			url: '/api/user_actions/' + action_id + '/get_useraction',
			type: 'GET',
			dataType: 'json',
			async: false,
		})
		.done(function(data) {
			var userAction = new UserActionInteraction(data);
			userAction.destroy();
		});

		this.collection.fetch();
	},
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
});

// Backbone view to display the results of search for new members for action page
SearchForActionView = Backbone.View.extend({
	initialize: function(options) {
		this.searchterm = options.searchterm;
	},
	render: function() {
		var source = $.app.templates.searchTemplate;
		var template = Handlebars.compile(source);
		var html = template({});

		this.$el.html(html);

		$(".actions_contatiner").remove();

		var userSearch = new SearchUsersForAction([], {id: this.id});
		var searchUserView = new SearchUsersForActionView({collection: userSearch, id: this.id});
		searchUserView.$el = $('#users');
		userSearch.fetch();
		searchUserView.delegateEvents();
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
	events: {
		"click #addbutton": 'add_friend',
		"click #rembutton": 'remove_friend',
	},
	error: function() {
		// if a user is not logged in, use an empty user object as the model to display
		// an empty user object is used since the login form is displayed overtop of the
		// profile view
		this.model = new User({'first_name' : "FirstName", 'last_name' : "LastName", 'image': '1'});
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
		if (typeof $.app.user === 'undefined') {
			temp.me = $.app.profile.get('id') == this.model.get('id');
		} else {
			temp.me = $.app.user.get('id') == this.model.get('id');
		}
		if (!temp.me) {
			$.ajax({
				url: '/api/users/' + this.model.get('id') + '/isfriend',
				type: 'GET',
				dataType: 'json',
				async: false,
			})
			.done(function(data) {
				temp.friend = data.status;
			});
		}
		
		var html = template(temp);

		this.$el.html(html);

		this.render_image();
		this.render_friends();
		this.render_actions();
		this.render_activities();
		this.render_interests();
		this.render_rating(this.model.get('rating'))
		this.render_map();

		var model = this.model;
		$(document).ready(function() {
			if (model.get('id') === $.app.user.get('id')) {
				$('.editable').hover(function() {
					$(this).append("<div class='edit' style='display: inline-block;'><img src='/static/skvallra/images/edit.png' id='edit_img'></div>");
					$(this).children('.edit').click(function (event) {
						var parent = $(this).parent();
						$(this).remove();
						parent.html("<input type='text' id='editing' style='width: 100%;' value='" + $.trim(parent.text()) + "'/>");
						parent.unbind();
						$('#editing').trigger('focus');
						$('#editing').blur(function (event) {
							var text = $(this).val();
							parent.html(text + " ");
							var classes = parent.attr('class');
							classes = classes.split(" ");
							classes.splice(classes.indexOf('editable'),1);
							var parentClass = classes[0];
							if (parentClass === 'birthday') {
								d = new Date(text);
								text = d.toISOString();
								$.app.user.set(classes[0], text);
								$.app.user.save();
							} else if (parentClass === 'name') {
								var names = text.split(" ");
								var first_name = names.shift();
								var last_name = names.join(" ");
								$.app.user.set('first_name', first_name);
								$.app.user.set('last_name', last_name);
								$.app.user.save();
							} else if (parentClass === 'address') {
								var geocoder = new google.maps.Geocoder();
								var address = text.replace(/, /g, ',').replace(/ /g, "+");

								if (geocoder) {
									geocoder.geocode({ 'address': address }, function (results, status) {
										if (status == google.maps.GeocoderStatus.OK) {
											var lat = results[0].geometry.location.k;
											var lon = results[0].geometry.location.A;
											var coords = lat + ',' + lon;
											$.app.user.set('coordinates', coords);
											$.app.user.set(parentClass, text);
											$.app.user.save();

										} else {
											alert($.app.errors_messages.geo_error);
											$.app.user.set(parentClass, text);
											$.app.user.save();
										}
									});
								} else {
									$.app.user.set(parentClass, text);
									$.app.user.save();
								}
							} else {
								$.app.user.set(parentClass, text);
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
				if (model.get('id') === $.app.user.get('id')) {
					$('#profileimagebox').unbind();
					$('#profileimagebox').hover(function() {
						$(this).append("<div class='edit'><img src='/static/skvallra/images/edit.png' id='edit_img'></div>");
						$(".edit").css("margin-top", - $('.profileimage').height());
						$(this).unbind('click');
						$(this).children('.edit').click(function (event) {
							$('.container').after('<div class="upload fadein"><form onSubmit="return false"><div><input class="form-control" type="file" id="file" /></div><div><div class="progress progress-striped active" style="display: none;"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div><div><input type="submit" id="submit" class="btn btn-default" value="submit" /></div></form></div>');
							$('.container').removeClass('unblur');
							$('.container').addClass('blur');

							$('#submit').click(function(event) {
								event.stopPropagation();
								event.preventDefault();
								if ($('#file')[0].files.length == 0) {
									return;
								}

								var data = new FormData();
								$.each($('#file')[0].files, function (key, value) {
									data.append(key, value);
								});
								$('.progress').css({'display': 'block', 'margin-bottom': '0px'});
								$.ajax({
									url: '/api/upload_image',
									type: 'POST',
									cache: false,
									dataType: 'json',
									data: data,
									processData: false,
									contentType: false,
									xhr: function() {  // Custom XMLHttpRequest
										var myXhr = $.ajaxSettings.xhr();
										if(myXhr.upload){ // Check if upload property exists
											myXhr.upload.addEventListener('progress',function (e) {
												if (e.lengthComputable) {
													$('progress').attr({value:e.loaded,max:e.total});
												}
											}, false); // For handling the progress of the upload
										}
										return myXhr;
									},
								})
								.done(function(data) {
									$('.upload').removeClass('fadein');
									$('.upload').addClass('fadeout');
									$('.upload').bind('oanimationend animationend webkitAnimationEnd', function () {
										$('.upload').unbind();
										$('.upload').remove();
									});
									$('.container').unbind('click');
									$('.container').removeClass('blur');
									$('.container').addClass('unblur');
									model.set('image', data.id);
									model.save();
								})
							});
							setTimeout(function () {
								$('.container').click(function(event) {
									event.stopPropagation();
									event.preventDefault();
									$('.upload').removeClass('fadein');
									$('.upload').addClass('fadeout');
									$('.upload').bind('oanimationend animationend webkitAnimationEnd', function () {
										$('.upload').unbind();
										$('.upload').remove();
									});
									$('.container').unbind('click');
									$('.container').removeClass('blur');
									$('.container').addClass('unblur');
								});
							}, 100);
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
		activitiesView.render();
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
		activitiesView.render();
	},
	render_rating: function (rating) {
		$('.rating').raty({ 
			path: '/static/skvallra/images/raty-img', // icons directory
			hints: ["very bad", "poor", "okay", "good", "excellent"], // star hints
			cancel: false, // allow cancel rating
			readOnly: true,
			score: rating, // startup score
		});
	},
	add_friend: function (event) {
		var friends = $.app.user.get('friends');
		friends.push(this.model.get('id'));
		var model = this.model;
		$.app.user.save({}, {
			success: function () {
				model.fetch();
			}
		});
	},
	remove_friend: function (event) {
		var friends = $.app.user.get('friends');

		var index = friends.indexOf(this.model.get('id'));
		friends.splice(index,1)
		
		var model = this.model;
		$.app.user.save({}, {
			success: function () {
				model.fetch();
			}
		});
	},
	render_map: function(){
		var mapDimensions = $("#googleMap").parent().width();
		var coords = this.model.get('coordinates');
		if (coords) {
			$("#googleMap").css({'height': mapDimensions, 'width': mapDimensions});
			coords = coords.split(",");
			var lat = coords[0];
			var lon = coords[1];
			var myCenter = new google.maps.LatLng(lat, lon)
			var mapProp = {	center: myCenter,
							zoom:15,
							mapTypeId:google.maps.MapTypeId.ROADMAP };
			var map = new google.maps.Map($('#googleMap')[0],mapProp);
			var marker = new google.maps.Marker({ position: myCenter});
			marker.setMap(map);
		}
		else {
			$("#googleMap").hide();
		}
	},
});

MainView = Backbone.View.extend({
	render: function () {
		var source = $.app.templates.mainTemplate;
		var template = Handlebars.compile(source);
		var html = template({'OAuthToken': $.app.OAuthToken});
		this.$el.html(html);
	}
});

ActionMainView = Backbone.View.extend({
	edit_data: function (model, actionExists) {
		var editOnHover = function () {
			$(this).children(".edit").remove();
			$(this).append("<div class='edit'><img src='/static/skvallra/images/edit.png' id='edit_img'></div>");

			$(this).children('.edit').click(function (event) {
				var parent = $(this).parent();
				$(this).remove();

				var classes = parent.attr('class');
				classes = classes.split(" ");
				classes.splice(classes.indexOf('editable'),1);

				var parentClass = classes[0];
				if (parentClass !== 'description') {
					parent.html("<input type='text' id='editing' style='width: 100%;' value='" + $.trim(parent.text()) + "'/>");
					$('#editing').trigger('focus');
				} else {
					parent.html("<textarea rows='4' cols='50' class='form-control' id='editing' value='" + $.trim(parent.text()) + "'>"+$.trim(parent.text())+"</textarea>");
					$('#editing').trigger('select');
				}

				parent.unbind();

				$('#editing').blur(function (event) {

					parent.hover(editOnHover, function() {
						$(this).children(".edit").remove();
					});
					
					var text = ActionMainView.prototype.encodeHTML($(this).val());
					parent.html(text + " ");

					if ((parentClass === 'start_date') || (parentClass === 'end_date')) {
						d = new Date(text);
						text = d.toISOString();	
					} 

					if (parentClass === 'address') {
						var geocoder = new google.maps.Geocoder();
						var address = text.replace(/, /g, ',').replace(/ /g, "+");

						if (geocoder) {
							geocoder.geocode({ 'address': address }, function (results, status) {
								if (status == google.maps.GeocoderStatus.OK) {
									var lat = results[0].geometry.location.k;
									var lon = results[0].geometry.location.A;
									var coords = lat + ',' + lon;
									model.set('coordinates', coords);
									model.set(parentClass, text);
									ActionMainView.prototype.save_model(model, actionExists);
								}
								else {
									alert($.app.errors_messages.geo_error);
									model.set(parentClass, text);
									ActionMainView.prototype.save_model(model, actionExists);
								}
							});
						}    
					} else { 
						model.set(parentClass, text);
						ActionMainView.prototype.save_model(model, actionExists);
					}
				});
			})
		}

		$('.editable').hover(editOnHover, function() {
			$(this).children(".edit").remove();
		});
	},
	edit_image: function() {
		$('#actionpageimage').unbind();
		$('#actionpageimage').hover(function() {
			var imgheight = $('.actionpageimage > img').height();
			$(this).append("<div class='edit pull-right'><img src='/static/skvallra/images/edit.png' id='edit_img'></div>");
			$('.actionpageimage > .edit').css('margin-top', 0 - imgheight);
			$(this).unbind('click');
			$(this).children('.edit').click(function (event) {
				$('.container').after('<div class="upload fadein"><form onSubmit="return false"><div><input class="form-control" type="file" id="file" /></div><div><div class="progress progress-striped active" style="display: none;"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div><div><input type="submit" id="submit" class="btn btn-default" value="submit" /></div></form></div>');
				$('.container').removeClass('unblur');
				$('.container').addClass('blur');
				$('#submit').click(function(event) {
					event.stopPropagation();
					event.preventDefault();
					if ($('#file')[0].files.length == 0) {
						return;
					}
					var data = new FormData();
					$.each($('#file')[0].files, function (key, value) {
						data.append(key, value);
					});
					$('.progress').css({'display': 'block', 'margin-bottom': '0px'});
					$.ajax({
						url: '/api/upload_image',
						type: 'POST',
						cache: false,
						dataType: 'json',
						data: data,
						processData: false,
						contentType: false,
						xhr: function() {  // Custom XMLHttpRequest
							var myXhr = $.ajaxSettings.xhr();
							if(myXhr.upload){ // Check if upload property exists
								myXhr.upload.addEventListener('progress',function (e) {
									if (e.lengthComputable) {
										$('progress').attr({value:e.loaded,max:e.total});
									}
								}, false); // For handling the progress of the upload
							}
							return myXhr;
						},
					})
					.done(function(data) {
						$('.upload').removeClass('fadein');
						$('.upload').addClass('fadeout');
						$('.upload').bind('oanimationend animationend webkitAnimationEnd', function () {
							$('.upload').unbind();
							$('.upload').remove();
						});
						$('.container').unbind('click');
						$('.container').removeClass('blur');
						$('.container').addClass('unblur');
						$.app.actionView.model.set('image', data.id);
						$.app.actionView.model.save();
					})
				});
				setTimeout(function () {
					$('.container').click(function(event) {
						event.stopPropagation();
						event.preventDefault();
						$('.upload').removeClass('fadein');
						$('.upload').addClass('fadeout');
						$('.upload').bind('oanimationend animationend webkitAnimationEnd', function () {
							$('.upload').unbind();
							$('.upload').remove();
						});
						$('.container').unbind('click');
						$('.container').removeClass('blur');
						$('.container').addClass('unblur');
					});
				}, 100);
			});
		}, function () {
			$(this).children('.edit').remove();
		});

	},
	add_users: function () {
		$('.users-editable').hover(function () {
			var parent = this; 
			var parentHeight = $(this).height();
			$(this).children(".edit").remove();
			var divIcon = $("<div class='edit pull-right'><img src='/static/skvallra/images/plus_small.png' id='edit_img'></div>");
			$(this).append(divIcon);		
			divIcon.css({"margin-top": -(parentHeight + divIcon.height())});

			$(this).children('.edit').click(function (event) {
				router.navigate("/invite_users/" + $.app.actionView.model.get('id'), {trigger: true});
			});
		}, function() {
			$(this).children('.edit').remove();
		});
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
	action_save_error: function(model, response, options) {
		var responseText = response.responseText;
		var messageStart = responseText.indexOf("\n");
		var messageEnd = responseText.indexOf("\n", messageStart + 1);
		var errorMessage = responseText.substring(messageStart, messageEnd);
		alert($.app.errors_messages.internal_error + "\n" + errorMessage);			
	},
	encodeHTML: function(s) {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	},
	prepare_date_for_render: function(given_date) {
		var options = {year: "numeric", month: "long", day: "numeric"};
		var new_date = new Date(given_date);
		return (new_date.toLocaleDateString("en-US", options) + " " + new_date.toLocaleTimeString());

	},
	save_model: function(model, actionExists) {
		if (actionExists) {
			model.save({}, {
				error: function(model, response, options) {
					ActionMainView.prototype.action_save_error(model, response, options);
				}							
			});
		}
	}
});

ActionLockView = ActionMainView.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .unlock" : "toggle_private_status",
		"click .lock" : "toggle_private_status",
	},
	render: function() {
		$(".participants_limit").empty();
		var view = this;
		var isOrganizer = this.model.get('role') == $.app._organizer;

		if (isOrganizer) {
			var actionPublicStatus = $.app.actionView.model.get('public');
			this.set_lock_icon(actionPublicStatus);

			var minUsers = $("<br><label>Minimum participants: </label> <div class='min_participants constraint editable'>" + 
				$.app.actionView.model.get('min_participants') + "</div>");
			var maxUsers = $("<br><label>Maximum participants: </label> <div class='max_participants constraint editable'>" + 
				$.app.actionView.model.get('max_participants') + "</div>");
			$(".participants_limit").append(minUsers, maxUsers);

			$(document).ready(function() {
				view.edit_data($.app.actionView.model, true);
				view.edit_image();
				view.add_users();
			});
		}
		else {
			$(document).ready(function() {
				view.add_users();
			});
		}
	},
	toggle_private_status: function() {
		// Toggle public / private status of Action.
		var actionUpdate = new Action({id: $.app.actionView.model.get('id')});
		var temp = this;
		actionUpdate.fetch({
			success: function(){
				var newActionStatus = !actionUpdate.get('public');
				actionUpdate.save({'public': newActionStatus});
				temp.set_lock_icon(newActionStatus);
			}
		})
	},
});

ActionControlsView = Backbone.View.extend({
	initialize: function() {
		// bind render function to add, change and sync events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	events: {
		// event, element and function to bind together
		"click .rating" : "update_rating",
		"click .leave" : "leave_action",
		"click .join" : "join_action",
	},
	render: function() {
		this.render_status_bar();
	},
	leave_action: function() {
		// Remove current user from the current Action. 
		this.model.url = "/api/useractions/" + this.model.get('id');
		this.model.destroy({
			// success does not function properly with empty responses, check statusCode instead. 
			statusCode: {
				204: function() {
					$(".leave").html("Join").switchClass("leave", "join");
					$(".rating").empty();	
					$(".action_status").empty();
					$(".editable").each(function(){
						$(this).removeClass("editable");
						$(this).unbind();
						$.app.actionView.render_participants();
					});	
				}
			},
			error: function() {
				alert($.app.errors_messages.internal_error);
			},

		});
	},
	join_action: function() {
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
				$.app.actionView.render_participants();
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
			this.draw_rating(this.model.get('rating'));

		} else {
			$(".participation").html('<button type="button" class="btn btn-default join">Join</button>');
		}
	},
	draw_rating: function(score) {
		// Invoke Raty plugin to draw star rating field.
		$('.rating').raty({ 
			path: '/static/skvallra/images/', // icons directory
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
	},
});

ActionParticipantsView = ActionFriendListView.extend({
	render: function() {
		var source = $.app.templates.friendList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());

		this.$el.html(html);
		this.render_image();
		this.remove_users();
	},
	remove_users: function() {
		var editOnHover = function () {
			var parent = $(this);
			$(this).children(".remove_user").remove();
			var parentHeight = parent.height();
			var parentWidth = parent.width();
			var divIcon = $("<div class='remove_user'><img src='/static/skvallra/images/cross_small.png' id='edit_img'></div>");
			parent.append(divIcon);
			divIcon.css({"margin-top": -parentHeight, "margin-left": parentWidth - 20});

			var userId = parent.children(".friend").attr('id');

			$('.remove_user').click(function (event) {
				var userActions = new UserActionInteractions({});
				userActions.fetch({
					success: function(model, response, options) {	
						var userAction = userActions.getByUserAndAction(userId, $.app.actionView.model.get('id'));
						userAction.destroy();
						$.app.actionView.render_participants();
					},
					error: function(model, response, options) {
						alert($.app.errors_messages.remove_user_from_action_error);
					}
				});
			})
		}

		$('.friend-box').hover(editOnHover, function() {
			$(this).children(".remove_user").remove();
		});
	},
});

// Backbone view to display the list of comments
ActionCommentsView = Backbone.View.extend({
	initialize: function() {
		// bind parents render_comments function to change event
		this.collection.on('change', $.app.actionView.render_comments, $.app.actionView);
		// bind render function to sync event
		this.collection.on('sync', this.render, this);
		this.collection.on('add', this.render, this);
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

		var renderElem = $(".comment > .col-md-2 > .userimage");
		ImageView.prototype.render_thumbnail(renderElem);
	},
	add_comment: function(event) {
		var NewComment = new Comment({
			"action_id": $(".title").get(0).id, 
			"user_id": $.app.user.id,  
			"comment_time": new Date().toISOString(), 
			"comment": $("#new_comment").val(),
		});
		NewComment.save();
		this.collection.add(NewComment);
	},
});

// Backbone view to display an action
ActionView = Backbone.View.extend({

	initialize: function() {
		// bind render function to add and change events
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
	},
	render: function() {
		var source = $.app.templates.actionTemplate;
		var template = Handlebars.compile(source);	
		var temp = this.model.toJSON();
		
		temp.start_date = ActionMainView.prototype.prepare_date_for_render(temp.start_date);
		temp.end_date = ActionMainView.prototype.prepare_date_for_render(temp.end_date);

		var html = template(temp);
		this.$el.html(html);

		this.render_image();
		this.render_tags();
		this.render_participants();
		this.render_comments();
		this.render_action_controls();
		this.render_rating_and_participation();
		this.render_map();
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
			var actionFriendListView = new ActionParticipantsView({collection: users});
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
	render_action_controls: function() {
		var lock = new RatingAndParticipation([], {id: this.model.get('action_id')});
		var actionPrivateStatus = new ActionLockView({model: lock});
		actionPrivateStatus.$el = $(".action_status");
		lock.fetch();
		actionPrivateStatus.delegateEvents();
	},
	render_rating_and_participation: function() {
		var actionStatusBar = new RatingAndParticipation([], {id: this.model.get('action_id')});
		var myActionControlsView = new ActionControlsView({model: actionStatusBar});
		myActionControlsView.$el = $(".action_controls");
		actionStatusBar.fetch();
		myActionControlsView.delegateEvents();
	},
	render_map: function(){
		var mapDimensions = $(".action_details").width();
		var coords = this.model.get('coordinates');
		if (coords) {
			coords = coords.split(",");
			$("#googleMap").css({'height': mapDimensions, 'width': mapDimensions});
			var lat = coords[0];
			var lon = coords[1];
			var myCenter = new google.maps.LatLng(lat, lon)
			var mapProp = {	center: myCenter,
							zoom:15,
							mapTypeId:google.maps.MapTypeId.ROADMAP };
			var map = new google.maps.Map($('#googleMap')[0],mapProp);
			var marker = new google.maps.Marker({ position: myCenter});
			marker.setMap(map);
		} else {
			$("#googleMap").hide();
		}
	},
});

CreateActionView = ActionMainView.extend({
	render: function() {
		var source = $.app.templates.createActionTemplate;
		var template = Handlebars.compile(source);
		var temp = this.model.toJSON();

		temp.start_date = this.prepare_date_for_render(temp.start_date);
		temp.end_date = this.prepare_date_for_render(temp.end_date);

		var html = template(temp);
		this.$el.html(html);

		var actionPrivateStatus = this.model.get("public");
		this.set_lock_icon(actionPrivateStatus);
		this.edit_data(this.model, false);
	},
	events: {
		"click .unlock" : "toggle_private_status",
		"click .lock" : "toggle_private_status",
		"click .create" : "create_action",
	},
	toggle_private_status: function() {
		var actionPrivateStatus = !this.model.get("public");
		this.model.set({"public": actionPrivateStatus});
		this.set_lock_icon(actionPrivateStatus);
	},
	create_action: function() {
		var newAction = this;
		newAction.model.save({}, {
			success: function(model, response, options)	{
				// create new UserAction relation
				var userAction = new UserActionInteraction({
										"action": newAction.model.get('action_id'), 
										"user": $.app.user.id,  
										"role": $.app._organizer });
				userAction.save({}, {
					success: function() {
						router.navigate("/action/" + newAction.model.get('action_id'), {trigger: true});
					},
					error: function(model, response, options) {
						// set an id so a model is considered 'old' by Backbone so destroy() can be fired
						newAction.model.set('id', newAction.model.get('action_id'));
						newAction.model.destroy(); // remove Action from database. 
						alert($.app.errors_messages.internal_error + "\n" + errorMessage);
					}
				});
			}, 
			error: function(model, response, options) {
				newAction.action_save_error(model, response, options);
			},
		});
	},
}); 

// Backbone router to allow for navigation though the app
// and to allow for urls within the app even though it is
// a single page and navigated completely through javascript
Router = Backbone.Router.extend({
	routes: {
		"": "show_profile",
		"suggested": "show_suggested",
		"configure_action": "configure_action",
		"nearby": "show_nearby",
		"settings": "show_settings",
		"logout": "logout",
		"statistics": "statistics",
		"action/:id": "show_action",
		"search/:term": "show_search",
		"activities/:term": "show_activities",
		"interests/:term": "show_interests",
		"invite_users/:id": "invite_users",
		":id": "show_profile",
		"action/:id": "show_action",
	},
	show_profile: function(id) {
		$.app.profile;
		if (id && $.app.OAuthToken !== undefined) {
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
		$.app.profileView.delegateEvents();
		$.app.profile.fetch();
	},
	show_suggested: function() {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var suggestedView = new SuggestedView();
			suggestedView.$el = $('#content');
			suggestedView.render();
		}
	},
	show_nearby: function() {
		// TODO: display the nearby actions page
	},
	show_settings: function() {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var settings = new Settings();
			var settingsView = new SettingsView({model: settings});
			settingsView.$el = $("#content");
			settings.fetch();
		}
	},
	statistics: function() {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var statsView = new StatisticsView();
			statsView.$el = $("#content");
			statsView.render();
		}
	},
	show_action: function(id) {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var action = new Action({id: id});
			$.app.actionView = new ActionView({model: action});
			$.app.actionView.$el = $("#content");
			action.fetch();
		}
	},
	show_search: function(term) {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var searchView = new SearchView({searchterm: term});
			searchView.$el = $("#content");
			searchView.render();
		}
	},
	show_activities: function(term) {
		// TODO: display search page with users and actions who do a specified activity
	},
	show_interests: function(term) {
		// TODO: display search page with users and actions who have a specified interest
	},
	configure_action: function() {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var d = new Date();
			var action = new Action({
				"title": "Action Title",
				"description": "Start writing your action description here!",
				"start_date": d,
				"end_date": d,
				"public": true, 
				"min_participants": 1,
				"max_participants": 1,
				"address": "Action Location",
			});
			var newActionView = new CreateActionView({model: action});
			newActionView.$el = $("#content");
			newActionView.render();
			newActionView.delegateEvents();
		}
	},
	invite_users: function(id) {
		if ($.app.OAuthToken === undefined){
			router.navigate("/", {trigger: true});
		} else {
			var searchForUsersForAcionView = new SearchForActionView({id: id});
			searchForUsersForAcionView.$el = $("#content");
			searchForUsersForAcionView.render();
		}
	},
	logout: function() {
		delete $.app.OAuthToken;
		$.removeCookie("OAuthToken", {domain : ".skvallra.com"});
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
		$.cookie("OAuthToken", $.app.OAuthToken, {domain: ".skvallra.com"});
		$("#logo").after('<ul class="nav navbar-nav navbar-right" id="logout"><li><a class="navbar-link" href="/logout">Logout</a></li></ul>');
		$('#navbar-form').after('<ul id="links" class="nav navbar-nav pull-right"><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown"><img src="/static/skvallra/images/other_gear_white_small.png" /></a><ul class="dropdown-menu"><li><a id="changepw" href="#">Change Password</a></li></ul></li></ul>');
		$("#changepw").click($.app.changepw);
		$("#links").find('ul').prepend('<li id="configure_action"><a href="/configure_action">Create Action</a></li>');
		$("#links").prepend('<li><a href="/suggested"><img src="/static/skvallra/images/friends_small.png" /></a></li>');
		$.ajax({
			url: '/api/is_admin',
			type: 'GET',
			dataType: 'json',
		})
		.done(function(data) {
			if (data) {
				$("#links").find('ul').append('<li id="display_statistics"><a href="/statistics">Display Statistics</a></li>');
			}
		});
		
		// reload the users profile
		$('.register').removeClass('register-animate');
		$('.login-animate').removeClass('login-animate').addClass('login');
		$('.login, .login-animate, .register').removeClass('fadein').addClass('fadeout');
		$('.container').removeClass('blur').addClass('unblur');
		$('.login, .login-animate, .register').bind('oanimationend animationend webkitAnimationEnd', function () {
			$('.login, .login-animate, .register').unbind();
			$('.login, .login-animate, .register').remove();
		});
		$.app.profileView.model = $.app.profile;
		$.app.profile.fetch();

	}).fail(function () {
		$('#error').text("Username/Password Incorrect.");
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
		$('#error').text("Passwords do not match.");
		return false;
	}
	var d = new Date();
	var user = new Profile({'username' : username, 'email' : email, 'password' : password, 'first_name' : fname, 'last_name' : lname, 'birthday' : d.toISOString()});
	user.save({}, {
		success: function () {
			$.app.authenticate();
		},
		error: function () {
			$('#error').text("Username already exists.");
		},
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
				$.removeCookie("OAuthToken", {domain: ".skvallra.com"});
				$('#logout').remove();
				$('#links').remove();
				$('#configure_action').remove();
				$('#display_statistics').remove();
			},
			200: function() {
				$(".login, .login-animate").remove();
				$(".container").css("-webkit-filter", "");
				$("#logo").after('<ul class="nav navbar-nav navbar-right" id="logout"><li><a class="navbar-link" href="/logout">Logout</a></li></ul>');
				$('#navbar-form').after('<ul id="links" class="nav navbar-nav pull-right"><li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown"><img src="/static/skvallra/images/other_gear_white_small.png" /></a><ul class="dropdown-menu"><li><a id="changepw" href="#">Change Password</a></li></ul></li></ul>');
				$("#changepw").click($.app.changepw);
				$("#links").find('ul').prepend('<li id="configure_action"><a href="/configure_action">Create Action</a></li>');
				$("#links").prepend('<li><a href="/suggested"><img src="/static/skvallra/images/friends_small.png" /></a></li>');
				$.ajax({
					url: '/api/is_admin',
					type: 'GET',
					dataType: 'json',
				})
				.done(function(data) {
					if (data) {
						$("#links").find('ul').append('<li id="display_statistics"><a href="/statistics">Display Statistics</a></li>');
					}
				});
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

$.app.changepw = function () {
	$('.container').after('<div id="change"><form onSubmit="return false" autocomplete="off"><div id="error"></div><div><input class="form-control" id="password" type="password" placeholder="Password" /></div><div><input class="form-control" id="passwordconfirm" type="password" placeholder="Confirm Password" /></div><div><input type="submit" class="btn btn-default" id="submit" value="Submit" /></div></form></div>');
	$('.container').removeClass('unblur').addClass('blur');
	$('#change').removeClass('fadeout').addClass('fadein');
	$('#change #submit').click(function(event) {
		var password = $('#password').val();
		var passwordconfirm = $('#passwordconfirm').val();
		if (password != passwordconfirm) {
			$('#error').text("Passwords do not match.");
			return;
		}
		$.ajax({
			url: '/api/change_password',
			type: 'POST',
			dataType: 'json',
			data: {'new_password': password},
		});
		
		$('#change').bind('oanimationend animationend webkitAnimationEnd', function () {
			$('#change').unbind();
			$('#change').remove();
		});
		$('#change').removeClass('fadein').addClass('fadeout');
		$('.container').removeClass('blur').addClass('unblur');
		$('.container').unbind('click');
	});
	$('.container').click(function(event) {
		$('#change').bind('oanimationend animationend webkitAnimationEnd', function () {
			$('#change').unbind();
			$('#change').remove();
		});
		$('#change').removeClass('fadein').addClass('fadeout');
		$('.container').removeClass('blur').addClass('unblur');
		$('.container').unbind('click');
	});
}

// list of templates the app should load
$.app.templates = ["actionList", "actionSearchTemplate", "actionTemplate", "activitiesList", "alistItemTemplate", 
					"flistItemTemplate", "friendList", "imageTemplate", "loginTemplate", 
					"profileTemplate", "searchListItemTemplate", "searchTemplate", "settingsTemplate", 
					"userSearchTemplate", "commentList", "mainTemplate",  "createActionTemplate", "statisticsViewTemplate",
					"listViewTemplate", "graphViewTemplate", "hitsViewTemplate", "suggestedViewTemplate"];

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
