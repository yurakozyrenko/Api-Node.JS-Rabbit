/**
 * @swagger
 *  components:
 *    schemas:
 *      Value:
 *        type: object
 *        required:
 *          - inputData
 *        properties:
 *          inputData:
 *            type: integer
 *            description: value
 *        example:
 *            inputData: 3
 */

/**
 * @swagger
 * /:
 *  post:
 *      summary: Create a new inputData
 *      tags: [Value]
 *      requestBody:
 *          required: true
 *          description: Create a new inputData
 *          content:
 *              application/json:
 *                  schema:
 *                     $ref: '#/components/schemas/Value'
 *      responses:
 *          200:
 *              description: The result successfull
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Value'
 *          500:
 *              description: Some server err
 */
