Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {

    Meteor.subscribe("tasks");

    Template.task.helpers({
        isOwner: function () {
            return this.owner === Meteor.userId();
        }
    });
    Template.body.events({
        "submit .new-task": function(e){
            e.preventDefault();
            var text = e.target.text;
            var priority = e.target.priority;
            Meteor.call("addTask", text.value, priority.value)
            text.value = "";
            priority.value = "";
        },
        "click .toggle-checked": function(){
            Meteor.call("setChecked", this._id, !this.checked)
        },
        "click .delete": function(){
            Meteor.call("removeTask", this._id);
        },
        "click .hide-completed input": function (e) {
            Session.set("hideCompleted", e.target.checked );
        },
        "click .toggle-private": function () {
            Meteor.call("setPrivate", this._id, ! this.private);
        }
    });

    Template.body.helpers({
        tasks: function(){
            if (Session.get("hideCompleted")){
                return Tasks.find({ checked: {$ne: true }}, {sort: {priority: -1}})
            }else{
                return Tasks.find({}, {sort: {priority: -1}});
            }
        },
        hideCompleted: function(){
            return Session.get("hideCompleted");
        },
        incompleteTasks: function(){
            return Tasks.find({checked: { $ne: true }}).count();
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_AND_EMAIL"
    });
}

Meteor.methods({
    addTask: function(text, pr){
        if (! Meteor.userId()){
            throw new Meteor.Error("not-authorized");
        }
        Tasks.insert({
            text: text,
            priority: pr,
            created_at: new Date(),
            private: false,
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
    },
    removeTask: function(taskId){
        var task = Tasks.findOne(taskId);
        if (task.private || task.owner !== Meteor.userId()) {
            alert("noooo");
            throw new Meteor.Error("not-authorized");
        }
        Tasks.remove(taskId);
    },
    setChecked: function(taskId, checked){
        Tasks.update(taskId, { $set: { checked: checked } });
    },
    setPrivate: function (taskId, setToPrivate) {
        var task = Tasks.findOne(taskId);

        if (task.owner !== Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Tasks.update(taskId, { $set: { private: setToPrivate}})
    }
});

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
    Meteor.publish("tasks", function(){
        //return Tasks.find();
        return Tasks.find({
            $or: [
                { private: {$ne: true} },
                { owner: this.userId }
            ]
        })
    });
}
