listItemTemplate = '\
	<div>\
		<div class="thumbnail">\
		</div>\
		<div class="name">\
			{{first_name}}\
		</div>\
	</div>';

activitiesList = '\
	{{#each []}}\
	<div class="tag">\
		{{this.tag_id}}\
	</div>\
	{{/each}}\
	<div class="pagebar">\
		{{! pagination bar goes here}}\
	</div>';

interestsList = '\
	{{#each interests}}\
	<div class="tag">\
		{{this.tag_id}}\
	</div>\
	{{/each}}\
	<div class="pagebar">\
		{{! pagination bar goes here}}\
	</div>';

friendList = '\
	<div class="list">\
	{{#each []}}\
		{{> listItem}}\
	{{/each}}\
	</div>\
	<div class="pagebar">\
		{{! pagination bar goes here}}\
	</div>';

actionList = '\
	<div class="list">\
	{{#each actions}}\
		{{> listItem}}\
	{{/each}}\
	</div>\
	<div class="pagebar">\
		{{! pagination bar goes here}}\
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

imageTemplate = '<img src="{{this.image_hash}}" width="100" />';

profileTemplate = '\
	{{#each []}}\
	<div class="container">\
		<div class="row">\
			<div class="userimage col-md-2">\
			</div>\
			<div class="information col-md-8">\
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
			<div class="col-md-2">\
				<div class="activities">\
					{{> activitiesList}}\
				</div>\
				<div class="interests">\
					{{> interestsList}}\
				</div>\
			</div>\
			<div class="col-md-8">\
				<div class="friends">\
				</div>\
				<div class="actions">\
					{{> actionsList}}\
				</div>\
			</div>\
		</div>\
	</div>\
	{{/each}}';

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
	urlRoot: '/users',
});

Users = Backbone.Collection.extend({
	model: User,
	url: "/users",
});

Activity = Backbone.Model.extend({
	urlRoot: "/tags",
});

Activities = Backbone.Collection.extend({
	model: Activity,
	url: "/tags",
});

Images = Backbone.Model.extend({
	urlRoot: '/images'
});

Profile = Backbone.Model.extend({
	urlRoot: '/me',
});

ProfileList = Backbone.Collection.extend({
	model: Profile,
	url: "/me",
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
			imageView.$el = $('.thumbnail');
			image.fetch();
		});
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
		var html = template(this.model.toJSON());

		this.$el.html(html);

		this.render_image();
		this.render_friends();
		this.render_activities();
		this.render_interests();
	},
	render_image: function() {
		var image = new Images({id: this.model.models[0].attributes.image});
		var imageView = new ImageView({model: image});
		imageView.$el = $('.userimage');
		image.fetch();
	},
	render_friends: function() {
		var friends = this.model.models[0].attributes.friends;
		var users = new Users();
		var actionFriendListView = new ActionFriendListView({collection: users});
		actionFriendListView.$el = $('.friends');
		$(friends).each(function() {
			var user = new User({id: this.valueOf()});
			users.add(user);
			user.fetch();
		});
	},
	render_activities: function() {
		var activities = this.model.models[0].attributes.activities;
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
		var activities = this.model.models[0].attributes.interests;
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

$(document).ready(function () {

	Handlebars.registerPartial("listItem", listItemTemplate);
	Handlebars.registerPartial("activitiesList", activitiesList);
	Handlebars.registerPartial("interestsList", interestsList);
	Handlebars.registerPartial("friendsList", friendList);
	Handlebars.registerPartial("actionsList", actionList);
	Handlebars.registerPartial("login", loginTemplate);


	var profile = new ProfileList();
	var profileView = new ProfileView({model: profile});
	profileView.$el = $("body");
	profile.fetch();

});

