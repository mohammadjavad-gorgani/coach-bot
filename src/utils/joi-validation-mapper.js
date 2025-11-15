
function validationMapper(error) {
    const { details } = error
    let invalidPaths = {}
    if (details?.length > 0) {
        for (const item of details) {
            invalidPaths[item.context.key] = item.message?.replace(/[\'\"\\]*/g, "")
        }
        return invalidPaths
    }
    return invalidPaths
}

module.exports = {
    validationMapper
}