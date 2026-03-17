const placementModel = require('../models/placementModel');
const placementService = require('../services/placementService');

async function showPlacementBoard(req, res) {
  const studentId = req.session.user.user_id;
  const [offers, applications] = await Promise.all([
    placementModel.listEligibleOffers(studentId),
    placementModel.listApplications(studentId)
  ]);

  return res.render('placements/index', {
    title: 'Placement Board',
    offers,
    applications
  });
}

async function apply(req, res) {
  const studentId = req.session.user.user_id;
  const offerId = Number(req.body.offerId);

  await placementService.applyToOffer(studentId, offerId);
  req.flash('success', 'Placement application submitted.');
  return res.redirect('/placements');
}

module.exports = {
  showPlacementBoard,
  apply
};
