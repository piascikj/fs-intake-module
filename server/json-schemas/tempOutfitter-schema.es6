module.exports = {
  id: '/tempOutfitterPermit',
  type: 'object',
  allOf: [
    { $ref: '/commonFields' },
    {
      properties: {
        applicantInfo: {
          $ref: '/tempOutfitterApplicantInfo'
        },
        type: {
          default: 'tempOutfitters',
          enum: ['noncommercial', 'tempOutfitters'],
          type: 'string'
        },
        tempOutfitterFields: {
          $ref: '/tempOutfitterFields'
        }
      },
      required: ['applicantInfo', 'type', 'tempOutfitterFields']
    }
  ]
};
