module.exports = {
  ensureAuthenticated: function(req, res, next){
    if(req.session.userid){
      return next();
    }
    res.redirect('/');
  },
  ensureGuest: function(req, res, next){
    if(req.session.userid){
      res.redirect('/blogs');
    } else {
      return next();
    }
  }
}