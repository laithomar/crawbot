const moment = require('moment'); // Library to Change and Manipulate Date Formats

module.exports = { // Helpers File is collection of functions that will do some actions to our project
  truncate: function(str, len){ //Cut the Description of Story in showing pages into specific length of strength
    if (str.length > len && str.length > 0) {
			var new_str = str + " ";
			new_str = str.substr(0, len);
			new_str = str.substr(0, new_str.lastIndexOf(" "));
			new_str = (new_str.length > 0) ? new_str : str.substr(0, len);
			return new_str + '...';
		}
		return str;
  },
  stripTags: function(input){ // Remove the HTML elementes and tags from  Story Body
    return input.replace(/<(?:.|\n)*?>/gm, '');
  },
  formatDate: function(date, format){ // Change Date format as per specific Style
    return moment(date).format(format);
  },
  select: function(selected, options){ // Return the checked value of selection list to use in Edit Story page
    return options.fn(this).replace( new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"').replace( new RegExp('>' + selected + '</option>'), ' selected="selected"$&');
  },
  editIcon: function(storyUser, loggedUser, storyId, floating = true){ // Showing Edit Icon as per specific permissions
    if(storyUser == loggedUser){
      if(floating){
        return `<a href="/stories/edit/${storyId}" class="btn-floating halfway-fab red"><i class="fa fa-pencil"></i></a>`;
      } else {
        return `<a href="/stories/edit/${storyId}"><i class="fa fa-pencil"></i></a>`;
      }
    } else {
      return '';
    }
  },
  add: function(a, b) {
    if (a && b) {
      return a + b;
    }
    return '';
  }
}