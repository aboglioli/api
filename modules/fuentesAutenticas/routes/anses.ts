
import { getServicioAnses } from '../../../utils/servicioAnses';
import * as express from 'express';
// Services
import { Logger } from '../../../utils/logService';
import { Auth } from '../../../auth/auth.class';

let router = express.Router();

router.get('/anses', function (req, res, next) {
    // if (!Auth.check(req, 'fa:get:sisa')) {
    //     return next(403);
    // }
    if (req.query) {
        let paciente = req.query;
        try {
            getServicioAnses();
        } catch (err) {
            //  Logger.log(req, 'fa_sisa', 'error', {
            //         error: err
            //     });
            console.log('Error catch matchSisa:', err);
            return next(err);
        };
    } else {
        return next(500);
    }
});


module.exports = router;
