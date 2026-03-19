const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');

router.post('/', async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    res.status(201).json({ id: candidate._id, message: 'Profile created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/resume', async (req, res) => {
  try {
    const { resume_url } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { resume_url, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Resume updated', resume_url: candidate.resume_url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/skills', async (req, res) => {
  try {
    const { skills } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { skills, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Skills updated', skills: candidate.skills });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/portfolio', async (req, res) => {
  try {
    const { portfolio_links } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { portfolio_links, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Portfolio updated', links: candidate.portfolio_links });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/match/:job_id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const jobsUrl = process.env.JOBS_SERVICE_URL || 'http://jobs:8002';
    const { default: fetch } = await import('node-fetch');
    const jobsRes = await fetch(`${jobsUrl}/jobs`);
    const jobs = await jobsRes.json();

    const job = jobs.find(j => j.id === req.params.job_id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const jobTags = job.tags.map(t => t.toLowerCase());
    const matched = candidateSkills.filter(s => jobTags.includes(s));
    const score = jobTags.length > 0
      ? Math.round((matched.length / jobTags.length) * 100)
      : 0;

    res.json({
      candidate_id: candidate._id,
      job_id: req.params.job_id,
      match_score: score,
      matched_skills: matched,
      total_job_tags: jobTags.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;