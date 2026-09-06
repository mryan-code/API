import moment from "moment";
function timerDuration(startTimer: moment.Moment): string {
	const endTimer = moment();
	const duration = endTimer.diff(startTimer, "milliseconds");
	return duration.toString() + " milliseconds";
}

export { timerDuration };
