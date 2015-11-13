Todos = new Mongo.Collection('todos');

if (Meteor.isClient) {
  
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
  
  angular.module('simple-todos', ['angular-meteor', 'accounts.ui']);
  
  angular.module('simple-todos').controller('TodosListCtrl', 
    ['$scope', '$meteor', function ($scope, $meteor) {
      
    $scope.$meteorSubscribe('todos');
    
    $scope.todos = $meteor.collection(function () {
      return Todos.find($scope.getReactively('query'), { sort: { createdAt: -1 } });
    });
    
    $scope.addTask = function (newTask) {
      $meteor.call('addTask', newTask);
    };

    $scope.deleteTask = function (task) {
      $meteor.call('deleteTask', task._id);
    };

    $scope.setChecked = function (task) {
      $meteor.call('setChecked', task._id, !task.checked);
    };
    
    $scope.setPrivate = function (task) {
      $meteor.call('setPrivate', task._id, !task.private);
    }
    
    $scope.$watch('hideCompleted', function() {
      if ($scope.hideCompleted)
        $scope.query = {checked: {$ne: true}};
      else
        $scope.query = {};
    });
    
    $scope.incompleteCount = function () {
      return Todos.find({ checked: {$ne: true} }).count();
    };
  }]);
}

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }
 
    Todos.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }
    
    Todos.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }
    
    Todos.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }
 
    Todos.update(taskId, { $set: { private: setToPrivate } });
  }
});

if (Meteor.isServer) {
  Meteor.publish('todos', function () {
    return Todos.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}
