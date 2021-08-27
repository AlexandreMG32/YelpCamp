const catchAsync = require("../utils/catchAsync")
const {campgroundSchema, reviewSchema} = require("../schemas/schemas")
const express = require('express');
const router = express.Router({mergeParams: true});
const Review = require("../models/review");
const Campground = require("../models/campground");

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

router.post("/", validateReview,  catchAsync(async (req, res) => {
    const {id} = req.params;
    const review = new Review(req.body.review);
    const camp = await Campground.findById(id);
    console.log(camp)
    camp.reviews.push(review);
    await camp.save();
    await review.save();
    res.redirect(`/campgrounds/${id}`)
}))


router.delete("/:reviewId", catchAsync( async(req, res, next) => {
    const {id, reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Campground.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
    const camp = await Campground.findById(req.params.id);
    res.redirect(`/campgrounds/${id}`)
}))

module.exports = router;