const { Anonymousrooms } = require('../../model/dbmodel');
const { generateRandomString } = require('../../libs/helpers/generator');
const { resolveUserIdentifier } = require('../../libs/helpers/helpers');

async function createDiscussion(req, res) {
  try {
    console.log(req.body);
    const { email, userid } = req.body;
    const creatorId = userid || await resolveUserIdentifier(email);
    if (creatorId) {
      const discussion = new Anonymousrooms({ topic: req.body.topic, topicId: generateRandomString(), createdBy: creatorId });
      const result = await discussion.save();
      console.log(result);
      if (discussion) {
        res.json({ Message: true, topicId: result.topicId });
      } else {
        res.json({ Message: false });
      }
    } else {
      res.json({ Message: false });
    }
  } catch (error) {
    console.log('Error at create discussion', error);
    res.status(500).json({ Message: false });
  }
}

async function getTopic(req, res) {
  try {
    console.log(req.body);
    const topic = await Anonymousrooms.findOne({ topicId: req.body.topicId }, { _id: 0, topic: 1 });
    console.log(topic);
    res.json({ topic });
  } catch (error) {
    console.log('Error at discussion display', error);
    res.status(500).json({ Message: false });
  }
}

module.exports = { createDiscussion, getTopic };
