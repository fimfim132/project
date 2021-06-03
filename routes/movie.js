const { checkCommentOwner } = require('../middleware');
const middlewareObj = require('../middleware');

var express     = require('express'),
    Available   = require('../models/available'),
    multer      = require('multer'),
    middleware  = require('../middleware'),
    Movie       = require('../models/movie'),
    Comment     = require('../models/comment'),
    path        = require('path'),
    storage     = multer.diskStorage({
                    destination: function(req, file, callback){
                        callback(null, 'public/uploads');
                    },
                    filename: function(req, file, callback){
                        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
                    }
    }),
    imgFilter = function(req, file, callback){
        if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
            return callback(new Error('Only JPG, JPEG, PNG anf GIF image file are allowed!'),false);
        }
        callback(null, true);
    },
    upload = multer({storage: storage, fileFilter: imgFilter}),
    router      = express.Router();

    let today = new Date(),
    dd = String(today.getDate()).padStart(2, '0').toLocaleString('en-US',{timeZone:'Asia/Bangkok'}),
    mm = String(today.getMonth() + 1).padStart(2, '0'),
    yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    
router.get('/', function(req, res){
    Movie.find({}).sort({date:1}).exec(function(err, allMovie){
        if(err){
            console.log(err);
        } else{
            res.render('movies/index.ejs', {movie: allMovie});
        }
    });
});

router.post('/', function(req, res){
    var img = req.body.img;
    var title = req.body.title;
    var year = req.body.year;
    var rate = req.body.rate;
    var newAvailable = {img: img, title: title, year: year, rate: rate};
    Available.create(newAvailable, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

router.get('/:id', middleware.isLoggedIn, function(req, res){
    Movie.findById(req.params.id).populate('comments').exec(function(err, foundMovie){
        if(err){
            console.log(err);
        } else {
            res.render('movies/detail.ejs', {movie: foundMovie});
        }
    });
});

router.post('/:id', middleware.isLoggedIn, function(req, res){
    Movie.findById(req.params.id, function(err, foundMovie){
        if(err){
            console.log(err);
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                    comment.author.id == req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    foundMovie.comments.push(comment);
                    foundMovie.save();
                    res.redirect('/movies/' + foundMovie._id);
                }
            });
        }
    });
});

router.put('/:id', upload.single('img'), function(req, res){
    if(req.file){
        req.body.movie.img = '/upload' + req.file.file.name;
    }
    Movie.findByIdAndUpdate(req.params.id, req.body.movie, function(err, updatedMovie){
        if(err){
            res.redirect('/admin/:id/edit');
        } else {
            res.redirect('/movies/' + req.params.id);
        }
    });
});

module.exports = router;