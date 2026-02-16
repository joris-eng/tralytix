package time

import stdtime "time"

type Clock interface {
	Now() stdtime.Time
}

type RealClock struct{}

func (RealClock) Now() stdtime.Time {
	return stdtime.Now()
}
