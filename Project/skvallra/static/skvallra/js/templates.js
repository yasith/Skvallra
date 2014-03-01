listItemTemplate = '\
	<div class="friend" id="{{id}}">\
		<div class="userimage" id="{{id}}">\
		</div>\
		<div class="userimagename">\
			<a>{{first_name}}</a>\
		</div>\
	</div>';

activitiesList = '\
	{{#each []}}\
	<div class="tag">\
		{{this.tag_id}}\
	</div>\
	{{/each}}\
	<div class="pagebar">\
		<ul class="pager">\
			<li class="previous"><a href="#">&laquo;</a></li>\
			<li class="next"><a href="#">&raquo;</a></li>\
		</ul>\
	</div>';

interestsList = '\
	{{#each interests}}\
	<div class="tag">\
		{{this.tag_id}}\
	</div>\
	{{/each}}\
	<div class="pagebar">\
		<ul class="pager">\
			<li class="previous"><a href="#">&laquo;</a></li>\
			<li class="next"><a href="#">&raquo;</a></li>\
		</ul>\
	</div>';

friendList = '\
	<div class="list">\
	{{#each []}}\
		{{> listItem}}\
	{{/each}}\
	</div>\
	<div class="pagebar">\
		<ul class="pager">\
			<li class="previous"><a href="#">&laquo;</a></li>\
			<li class="next"><a href="#">&raquo;</a></li>\
		</ul>\
	</div>';

actionList = '\
	<div class="list">\
	{{#each actions}}\
		{{> listItem}}\
	{{/each}}\
	</div>\
	<div class="pagebar">\
		<ul class="pager">\
			<li class="previous"><a href="#">&laquo;</a></li>\
			<li class="next"><a href="#">&raquo;</a></li>\
		</ul>\
	</div>';

loginTemplate = '\
	<div class="login">\
		<div>\
			<input id="username" type="text" />\
		</div>\
		<div>\
			<input id="password" type="password" />\
		</div>\
	</div>';

imageTemplate = '<img src="{{this.image_hash}}" />';

profileTemplate = '\
	<div class="container">\
		<div class="row">\
			<div class="col-md-3">\
				<div class="profileimage">\
				</div>\
			</div>\
			<div class="information col-md-7">\
				<div class="name">\
					{{this.first_name}} {{this.last_name}}\
				</div>\
				<div class="birthday">\
					{{this.birthday}}\
				</div>\
				<div class="address">\
					{{this.address}}\
				</div>\
			</div>\
		</div>\
		<div class="row">\
			<div class="col-md-3">\
				<div class="activities">\
					{{> activitiesList}}\
				</div>\
				<div class="interests">\
					{{> interestsList}}\
				</div>\
			</div>\
			<div class="col-md-7">\
				<div class="friends">\
				</div>\
				<div class="actions">\
					{{> actionsList}}\
				</div>\
			</div>\
		</div>\
	</div>';

searchListItemTemplate = '\
	<div>\
		<div>\
			<img src="{{this.image}}" />\
		</div>\
		<div>\
			{{this.name}}\
		</div>\
	<div>';

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
	urlRoot: '/api/me/',
});

ProfileList = Backbone.Collection.extend({
	model: Profile,
	url: "/api/me/",
});

ListItemView = Backbone.View.extend({
	render: function() {
		var source = listItemTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());

		this.$el.html(html);
	}
});

TagsListView = Backbone.View.extend({
	render: function() {
		var source = tagsList;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());

		this.$el.html(html);	
	}
});

ActivitiesView = Backbone.View.extend({
	initialize: function() {
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);
	},
	render: function() {
		var source = activitiesList;
		var template = Handlebars.compile(source);
		var html = template(this.collection.toJSON());
		this.$el.html(html);
	}
})

ActionFriendListView = Backbone.View.extend({
	initialize: function() {
		this.collection.on('add', this.render, this);
		this.collection.on('change', this.render, this);
		this.collection.on('sync', this.render, this);

	},
	events: {
		"click .friend": "navi",
	},
	render: function() {
		var source = friendList;
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
		router.navigate("/" + event.currentTarget.id, {trigger: true});
	}
});

LoginView = Backbone.View.extend({
	render: function() {
		var source = loginTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());

		this.$el.html(html);
	}
});

ImageView = Backbone.View.extend({
	initialize: function() {
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	render: function() {
		var source = imageTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());

		this.$el.html(html);
	}
});

ProfileView = Backbone.View.extend({
	initialize: function() {
		this.model.on('add', this.render, this);
		this.model.on('change', this.render, this);
		this.model.on('sync', this.render, this);
	},
	render: function() {
		var source = profileTemplate;
		var template = Handlebars.compile(source);

		var data = this.model.attributes;
		
		var d = new Date(data.birthday);
		data.birthday = d.toLocaleDateString();
		
		var html = template(this.model.toJSON());

		this.$el.html(html);

		this.render_image();
		this.render_friends();
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

SearchListItemView = Backbone.View.extend({
	render: function() {
		var source = searchListItemTemplate;
		var template = Handlebars.compile(source);
		var html = template(this.model.toJSON());
		
		this.$el.html(html);
	}
});

Router = Backbone.Router.extend({
	routes: {
		"": "show_profile",
		":id": "show_profile",
	},
	show_profile: function(id) {
		var profile;
		if (id) {
			profile = new User({id: id});
		} else {
			profile = new Profile();
		}

		var profileView = new ProfileView({model: profile});
		profileView.$el = $("#content");
		profile.fetch();
	},
});

$(document).ready(function () {

	Handlebars.registerPartial("listItem", listItemTemplate);
	Handlebars.registerPartial("activitiesList", activitiesList);
	Handlebars.registerPartial("interestsList", interestsList);
	Handlebars.registerPartial("friendsList", friendList);
	Handlebars.registerPartial("actionsList", actionList);
	Handlebars.registerPartial("login", loginTemplate);

	router = new Router();
	Backbone.history.start({pushState: true});


});

