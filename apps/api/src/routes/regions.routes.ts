import express from 'express';
import * as regionsService from '../services/regions.service';

const router = express.Router();

/**
 * GET /api/regions/countries
 * Get all active countries
 */
router.get('/countries', async (req, res, next) => {
  try {
    const countries = await regionsService.getAllCountries();
    res.json({ success: true, data: countries });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/countries/:code
 * Get country details by code
 */
router.get('/countries/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const country = await regionsService.getCountryByCode(code);
    res.json({ success: true, data: country });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/countries/:code/cities
 * Get cities for a country
 */
router.get('/countries/:code/cities', async (req, res, next) => {
  try {
    const { code } = req.params;
    const cities = await regionsService.getCitiesByCountry(code);
    res.json({ success: true, data: cities });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/countries/:code/operators
 * Get phone operators for a country
 */
router.get('/countries/:code/operators', async (req, res, next) => {
  try {
    const { code } = req.params;
    const operators = await regionsService.getOperatorsByCountry(code);
    res.json({ success: true, data: operators });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/countries/:code/languages
 * Get languages for a country
 */
router.get('/countries/:code/languages', async (req, res, next) => {
  try {
    const { code } = req.params;
    const languages = await regionsService.getLanguagesByCountry(code);
    res.json({ success: true, data: languages });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/countries/:code/education-systems
 * Get education systems for a country
 */
router.get('/countries/:code/education-systems', async (req, res, next) => {
  try {
    const { code } = req.params;
    const systems = await regionsService.getEducationSystemsByCountry(code);
    res.json({ success: true, data: systems });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/regions/validate-phone
 * Validate a phone number for a country
 */
router.post('/validate-phone', async (req, res, next) => {
  try {
    const { phone, countryCode } = req.body;
    const result = await regionsService.validatePhoneNumber(phone, countryCode);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
