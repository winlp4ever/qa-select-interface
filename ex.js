const actions = {
    askQuestion: {
        id: 0,
        shortname: "askQuestion",
        desc: 'student is invited to ask question',
        waitTerminated: true,
        conditionalResponses: {
            ok: {
                nextActionId: 1
            },
            questionFuzzy: {
                nextActionId: 2
            },
            responseNotFound: {
                nextActionId: 2
            }
        }
    },
    answer: {
        id: 1,
        shortname: 'answer',
        desc: 'find a possible response to the student\' question',
        waitTerminated: true,
        conditionalResponses: {
            ok: {
                nextActionId: 3
            }
        }
    },
    unableToAnswer: {
        id: 2,
        shortname: 'unableToAnswer',
        desc: 'cannot find an answer to this question',
        waitTerminated: true,
        conditionalResponses: {
            ok: {
                nextActionId: 4
            }
        }
    },
    evalResponse: {
        id: 3,
        shortname: 'evalResponse',
        desc: 'student is invited to evaluate question',
        waitTerminated: false,
        conditionalResponses: {
            ok: {
                nextActionId: 4
            }
        }
    },
    relatedQuestions: {
        id: 4,
        shortname: 'relatedQuestions',
        desc: 'output related questions',
        waitTerminated: false,
        conditionalResponses: {
            ok: {
                nextActionId: 1
            },
            responseNotFound: {
                nextActionId: 2
            }
        }
    },
    askErrCode: {
        id: 5,
        shortname: 'askErrCode',
        desc: 'ask for error code',
        waitTerminated: true,
        conditionalResponses: {
            ok: {
                actionId: 7
            },
            noErrCode: {
                actionId: 6
            },
            invalidErrCode: {
                actionId: 6
            }
        }
    },
    showCommonErrors: {
        id: 6,
        shortname: 'showCommonErrors',
        desc: 'show common errors',
        waitTerminated: true,

    },
    showHelp: {
        id: 7,
        shortname: 'showHelp',
        desc: 'show help',
        waitTerminated: true
    }
}

const conditions = {
    ok: {
        id: 0,
        desc: 'at least one response found for this question'
    },
    responseNotFound: {
        id: 1,
        desc: 'no response found for this question'
    },
    questionFuzzy: {
        id: 2,
        desc: 'question not clear'
    },
    noErrCode: {
        id: 3,
        desc: 'no error code'
    },
    invalidErrCode: {
        id: 4,
        desc: 'invalid error code'
    }
}