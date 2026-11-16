// lib/analytics/engine.ts

export interface DailyMetrics {
    date: string;
    status: 'Completed' | 'Ongoing' | 'Not Yet - No Data';
    totalMembers: number;
    present: number;
    absent: number;
    visitors: number;
    newMembers: number;
    firstTimers: number;
    totalInRoom: number;
    attendanceRate: number;
    absenceRate: number;
    visitorRate: number;
    newMemberRate: number;
    visitorConversion: number;
    firstTimerRate: number;
    comparisonVsLastSunday?: {
        attendanceDiff: number;
        attendancePercentDiff: number;
        visitorsDiff: number;
    };
    attendeesList: any[];
    absenteesList: any[];
    visitorsList: any[];
}

export interface MonthlyMetrics {
    monthKey: string;
    monthTitle: string;
    sundayCount: number;
    completedSundaysCount: number;
    dailyCards: DailyMetrics[];
    totalMembersStart: number;
    totalMembersEnd: number;
    averagePresent: number;
    averageAttendanceRate: number;
    averageVisitorsPerSunday: number;
    totalVisitorVisits: number;
    uniqueVisitors: number;
    totalNewMembers: number;
    monthlyGrowthRate: number;
    bestSundayByCount: { label: string; count: number };
    worstSundayByCount: { label: string; count: number };
    bestSundayByRate: { label: string; rate: number };
    worstSundayByRate: { label: string; rate: number };
    firstTimersCount: number;
    returningVisitorsCount: number;
    repeatVisitorsCount: number;
    repeatRate: number;
    visitorsCameTwice: number;
    visitorsCameThreePlus: number;
    visitorConversionMonth: number;
    retentionRate3PlusSundays: number;
    highlyConsistentCount: number;
    atRiskZeroAttendanceCount: number;
    slippingOneAttendanceCount: number;
    status: 'Ongoing' | 'Completed' | 'Not Yet - No Data';
    momComparison: {
        attendanceRateDiff: number;
        averagePresentDiff: number;
        visitorsDiff: number;
        newMembersDiff: number;
        verdict: string;
    };
}

export interface QuarterlyMetrics {
    quarterKey: string;
    quarterTitle: string;
    monthlyCards: MonthlyMetrics[];
    totalMembersStart: number;
    totalMembersEnd: number;
    quarterGrowthRate: number;
    averageAttendanceRateQuarter: number;
    averagePresentQuarter: number;
    totalVisitorVisitsQuarter: number;
    uniqueVisitorsQuarter: number;
    totalNewMembersQuarter: number;
    quarterVisitorConversion: number;
    repeatVisitorRateQuarter: number;
    bestMonthByRate: { label: string; rate: number };
    worstMonthByRate: { label: string; rate: number };
    bestSundayInQuarter: { label: string; count: number; rate: number };
    worstSundayInQuarter: { label: string; count: number; rate: number };
    retentionQuarter: number;
    status: 'Ongoing' | 'Completed' | 'Not Yet - No Data';
    qoqComparison: {
        membersDiffPercent: number;
        attendanceRateDiff: number;
        visitorsDiff: number;
        newMembersDiff: number;
        verdict: string;
    };
}

export interface YearlyMetrics {
    yearKey: string;
    yearTitle: string;
    quarterlyCards: QuarterlyMetrics[];
    membersStartOfYear: number;
    membersEndOfYear: number;
    yearlyGrowthRate: number;
    averageAttendanceRateYear: number;
    averagePresentYear: number;
    totalVisitorVisitsYear: number;
    uniqueVisitorsYear: number;
    totalNewMembersYear: number;
    yearlyVisitorConversion: number;
    repeatVisitorRateYear: number;
    bestQuarterByRate: { label: string; rate: number };
    worstQuarterByRate: { label: string; rate: number };
    bestSundayInYear: { label: string; count: number };
    bestMonthInYear: string;
    mostConsistentMembers: any[];
    atRiskYearlyMembers: any[];
    turnoverRate: number;
    yoyComparison: {
        attendanceRateDiff: number;
        growthDiff: number;
        visitorsDiff: number;
        newMembersDiff: number;
        verdict: string;
    };
}

export function formatDateLabel(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

export function computeDailyMetrics(
    dateStr: string,
    members: any[],
    attendance: any[],
    guestAttendance: any[],
    guestProfiles: any[],
    previousSundayDaily?: DailyMetrics
): DailyMetrics {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isFuture = new Date(dateStr).getTime() > new Date(todayStr).getTime();
    const isToday = dateStr === todayStr;

    const activeMembers = members.filter(m => !m.is_deleted && (!m.created_at || m.created_at.slice(0, 10) <= dateStr));
    const totalMembers = activeMembers.length;

    const presentMemberIds = new Set(
        attendance
            .filter(a => (a.session_date || '').slice(0, 10) === dateStr)
            .map(a => a.user_id)
    );

    const present = activeMembers.filter(m => presentMemberIds.has(m.id)).length;
    const todayGuestAtt = guestAttendance.filter(g => (g.session_date || '').slice(0, 10) === dateStr);
    const visitors = todayGuestAtt.length;

    if (isFuture) {
        return {
            date: dateStr,
            status: 'Not Yet - No Data',
            totalMembers,
            present: 0,
            absent: totalMembers,
            visitors: 0,
            newMembers: 0,
            firstTimers: 0,
            totalInRoom: 0,
            attendanceRate: 0,
            absenceRate: 100,
            visitorRate: 0,
            newMemberRate: 0,
            visitorConversion: 0,
            firstTimerRate: 0,
            attendeesList: [],
            absenteesList: activeMembers,
            visitorsList: [],
        };
    }

    const status = isToday && present === 0 && visitors === 0 ? 'Ongoing' : 'Completed';
    const absent = Math.max(0, totalMembers - present);
    const newMembers = activeMembers.filter(m => m.created_at && m.created_at.slice(0, 10) === dateStr).length;

    const firstTimers = todayGuestAtt.filter(g => {
        const allVisitsForGuest = guestAttendance.filter(ga => ga.guest_id === g.guest_id);
        const earliestVisit = allVisitsForGuest.reduce((earliest, curr) => curr.session_date < earliest ? curr.session_date : earliest, allVisitsForGuest[0]?.session_date);
        return earliestVisit?.slice(0, 10) === dateStr;
    }).length;

    const totalInRoom = present + visitors;
    const attendanceRate = totalMembers > 0 ? Number(((present / totalMembers) * 100).toFixed(1)) : 0;
    const absenceRate = totalMembers > 0 ? Number(((absent / totalMembers) * 100).toFixed(1)) : 0;
    const visitorRate = totalInRoom > 0 ? Number(((visitors / totalInRoom) * 100).toFixed(1)) : 0;
    const newMemberRate = totalMembers > 0 ? Number(((newMembers / totalMembers) * 100).toFixed(1)) : 0;
    const visitorConversion = visitors > 0 ? Number(((newMembers / visitors) * 100).toFixed(1)) : 0;
    const firstTimerRate = visitors > 0 ? Number(((firstTimers / visitors) * 100).toFixed(1)) : 0;

    let comparisonVsLastSunday = undefined;
    if (previousSundayDaily && previousSundayDaily.status === 'Completed') {
        comparisonVsLastSunday = {
            attendanceDiff: present - previousSundayDaily.present,
            attendancePercentDiff: Number((attendanceRate - previousSundayDaily.attendanceRate).toFixed(1)),
            visitorsDiff: visitors - previousSundayDaily.visitors,
        };
    }

    return {
        date: dateStr,
        status,
        totalMembers,
        present,
        absent,
        visitors,
        newMembers,
        firstTimers,
        totalInRoom,
        attendanceRate,
        absenceRate,
        visitorRate,
        newMemberRate,
        visitorConversion,
        firstTimerRate,
        comparisonVsLastSunday,
        attendeesList: activeMembers.filter(m => presentMemberIds.has(m.id)),
        absenteesList: activeMembers.filter(m => !presentMemberIds.has(m.id)),
        visitorsList: todayGuestAtt,
    };
}

export function computeMonthlyMetrics(
    monthKey: string,
    monthTitle: string,
    sundayDates: string[],
    members: any[],
    attendance: any[],
    guestAttendance: any[],
    guestProfiles: any[],
    previousMonth?: MonthlyMetrics
): MonthlyMetrics {
    const dailyCards: DailyMetrics[] = sundayDates.map((dateStr, idx, arr) => {
        const prev = idx > 0 ? computeDailyMetrics(arr[idx - 1], members, attendance, guestAttendance, guestProfiles) : undefined;
        return computeDailyMetrics(dateStr, members, attendance, guestAttendance, guestProfiles, prev);
    });

    const completedCards = dailyCards.filter(c => c.status === 'Completed' || c.status === 'Ongoing');
    const sundayCount = sundayDates.length;
    const completedSundaysCount = completedCards.length;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const status = monthKey === currentMonthKey ? 'Ongoing' : monthKey > currentMonthKey ? 'Not Yet - No Data' : 'Completed';

    const totalMembersStart = members.filter(m => !m.is_deleted && m.created_at && m.created_at.slice(0, 7) < monthKey).length;
    const totalMembersEnd = members.filter(m => !m.is_deleted && m.created_at && m.created_at.slice(0, 7) <= monthKey).length;
    const monthlyGrowthRate = totalMembersStart > 0 ? Number((((totalMembersEnd - totalMembersStart) / totalMembersStart) * 100).toFixed(1)) : 0;

    const averagePresent = completedSundaysCount > 0 ? Number((completedCards.reduce((acc, c) => acc + c.present, 0) / completedSundaysCount).toFixed(1)) : 0;
    const averageAttendanceRate = completedSundaysCount > 0 ? Number((completedCards.reduce((acc, c) => acc + c.attendanceRate, 0) / completedSundaysCount).toFixed(1)) : 0;

    const monthGuestAtt = guestAttendance.filter(g => (g.session_date || '').slice(0, 7) === monthKey);
    const totalVisitorVisits = monthGuestAtt.length;
    const uniqueVisitors = new Set(monthGuestAtt.map(g => g.guest_id)).size;
    const averageVisitorsPerSunday = completedSundaysCount > 0 ? Number((totalVisitorVisits / completedSundaysCount).toFixed(1)) : 0;

    const visitCountsMap: Record<string, number> = {};
    monthGuestAtt.forEach(g => {
        visitCountsMap[g.guest_id] = (visitCountsMap[g.guest_id] || 0) + 1;
    });

    const visitorsCameTwice = Object.values(visitCountsMap).filter(count => count === 2).length;
    const visitorsCameThreePlus = Object.values(visitCountsMap).filter(count => count >= 3).length;
    const repeatVisitorsCount = visitorsCameTwice + visitorsCameThreePlus;
    const repeatRate = uniqueVisitors > 0 ? Number(((repeatVisitorsCount / uniqueVisitors) * 100).toFixed(1)) : 0;

    const totalNewMembers = members.filter(m => m.created_at && m.created_at.slice(0, 7) === monthKey).length;
    const visitorConversionMonth = uniqueVisitors > 0 ? Number(((totalNewMembers / uniqueVisitors) * 100).toFixed(1)) : 0;

    const firstTimersCount = monthGuestAtt.filter(g => {
        const allVisits = guestAttendance.filter(ga => ga.guest_id === g.guest_id);
        const earliest = allVisits.reduce((min, curr) => curr.session_date < min ? curr.session_date : min, allVisits[0]?.session_date);
        return earliest?.slice(0, 7) === monthKey;
    }).length;
    const returningVisitorsCount = Math.max(0, uniqueVisitors - firstTimersCount);

    let bestSundayByCount = { label: 'None', count: -1 };
    let worstSundayByCount = { label: 'None', count: 99999 };
    let bestSundayByRate = { label: 'None', rate: -1 };
    let worstSundayByRate = { label: 'None', rate: 101 };

    completedCards.forEach(c => {
        if (c.present > bestSundayByCount.count) bestSundayByCount = { label: formatDateLabel(c.date), count: c.present };
        if (c.present < worstSundayByCount.count) worstSundayByCount = { label: formatDateLabel(c.date), count: c.present };
        if (c.attendanceRate > bestSundayByRate.rate) bestSundayByRate = { label: formatDateLabel(c.date), rate: c.attendanceRate };
        if (c.attendanceRate < worstSundayByRate.rate) worstSundayByRate = { label: formatDateLabel(c.date), rate: c.attendanceRate };
    });

    const activeMembersList = members.filter(m => !m.is_deleted);
    const memberAttendanceCounts: Record<string, number> = {};
    activeMembersList.forEach(m => {
        memberAttendanceCounts[m.id] = 0;
    });

    attendance.forEach(a => {
        const aMonth = (a.session_date || '').slice(0, 7);
        if (aMonth === monthKey && memberAttendanceCounts[a.user_id] !== undefined) {
            memberAttendanceCounts[a.user_id]++;
        }
    });

    const attendanceValues = Object.values(memberAttendanceCounts);
    const highlyConsistentCount = attendanceValues.filter(count => count >= sundayCount && sundayCount > 0).length;
    const retentionCount = attendanceValues.filter(count => count >= 3).length;
    const retentionRate3PlusSundays = activeMembersList.length > 0 ? Number(((retentionCount / activeMembersList.length) * 100).toFixed(1)) : 0;
    const atRiskZeroAttendanceCount = attendanceValues.filter(count => count === 0).length;
    const slippingOneAttendanceCount = attendanceValues.filter(count => count === 1).length;

    let momComparison = { attendanceRateDiff: 0, averagePresentDiff: 0, visitorsDiff: 0, newMembersDiff: 0, verdict: 'First month recorded.' };
    if (previousMonth) {
        const rateDiff = Number((averageAttendanceRate - previousMonth.averageAttendanceRate).toFixed(1));
        momComparison = {
            attendanceRateDiff: rateDiff,
            averagePresentDiff: Number((averagePresent - previousMonth.averagePresent).toFixed(1)),
            visitorsDiff: uniqueVisitors - previousMonth.uniqueVisitors,
            newMembersDiff: totalNewMembers - previousMonth.totalNewMembers,
            verdict: rateDiff >= 0 ? `Better than last month by +${rateDiff}% attendance rate` : `Lower than last month by ${Math.abs(rateDiff)}%`,
        };
    }

    return {
        monthKey,
        monthTitle,
        sundayCount,
        completedSundaysCount,
        dailyCards,
        totalMembersStart,
        totalMembersEnd,
        averagePresent,
        averageAttendanceRate,
        averageVisitorsPerSunday,
        totalVisitorVisits,
        uniqueVisitors,
        totalNewMembers,
        monthlyGrowthRate,
        bestSundayByCount,
        worstSundayByCount,
        bestSundayByRate,
        worstSundayByRate,
        firstTimersCount,
        returningVisitorsCount,
        repeatVisitorsCount,
        repeatRate,
        visitorsCameTwice,
        visitorsCameThreePlus,
        visitorConversionMonth,
        retentionRate3PlusSundays,
        highlyConsistentCount,
        atRiskZeroAttendanceCount,
        slippingOneAttendanceCount,
        status,
        momComparison,
    };
}

export function computeQuarterlyMetrics(
    quarterKey: string,
    quarterTitle: string,
    monthKeys: { key: string; title: string; sundays: string[] }[],
    members: any[],
    attendance: any[],
    guestAttendance: any[],
    guestProfiles: any[],
    previousQuarter?: QuarterlyMetrics
): QuarterlyMetrics {
    const monthlyCards: MonthlyMetrics[] = monthKeys.map((m, idx, arr) => {
        const prevMonth = idx > 0 ? computeMonthlyMetrics(arr[idx - 1].key, arr[idx - 1].title, arr[idx - 1].sundays, members, attendance, guestAttendance, guestProfiles) : undefined;
        return computeMonthlyMetrics(m.key, m.title, m.sundays, members, attendance, guestAttendance, guestProfiles, prevMonth);
    });

    const status = monthlyCards.some(m => m.status === 'Ongoing') ? 'Ongoing' : monthlyCards.every(m => m.status === 'Not Yet - No Data') ? 'Not Yet - No Data' : 'Completed';

    const totalMembersStart = monthlyCards[0]?.totalMembersStart || 0;
    const totalMembersEnd = monthlyCards[monthlyCards.length - 1]?.totalMembersEnd || totalMembersStart;
    const quarterGrowthRate = totalMembersStart > 0 ? Number((((totalMembersEnd - totalMembersStart) / totalMembersStart) * 100).toFixed(1)) : 0;

    const averageAttendanceRateQuarter = monthlyCards.length > 0 ? Number((monthlyCards.reduce((acc, m) => acc + m.averageAttendanceRate, 0) / monthlyCards.length).toFixed(1)) : 0;
    const averagePresentQuarter = monthlyCards.length > 0 ? Number((monthlyCards.reduce((acc, m) => acc + m.averagePresent, 0) / monthlyCards.length).toFixed(1)) : 0;

    const totalVisitorVisitsQuarter = monthlyCards.reduce((acc, m) => acc + m.totalVisitorVisits, 0);
    const quarterGuestAtt = guestAttendance.filter(g => {
        const qMonth = (g.session_date || '').slice(0, 7);
        return monthKeys.some(mk => mk.key === qMonth);
    });
    const uniqueVisitorsQuarter = new Set(quarterGuestAtt.map(g => g.guest_id)).size;
    const totalNewMembersQuarter = monthlyCards.reduce((acc, m) => acc + m.totalNewMembers, 0);
    const quarterVisitorConversion = uniqueVisitorsQuarter > 0 ? Number(((totalNewMembersQuarter / uniqueVisitorsQuarter) * 100).toFixed(1)) : 0;

    const qGuestCounts: Record<string, number> = {};
    quarterGuestAtt.forEach(g => {
        qGuestCounts[g.guest_id] = (qGuestCounts[g.guest_id] || 0) + 1;
    });
    const repeatGuestsQuarterCount = Object.values(qGuestCounts).filter(count => count >= 2).length;
    const repeatVisitorRateQuarter = uniqueVisitorsQuarter > 0 ? Number(((repeatGuestsQuarterCount / uniqueVisitorsQuarter) * 100).toFixed(1)) : 0;

    let bestMonthByRate = { label: 'None', rate: -1 };
    let worstMonthByRate = { label: 'None', rate: 101 };
    monthlyCards.forEach(m => {
        if (m.averageAttendanceRate > bestMonthByRate.rate) bestMonthByRate = { label: m.monthTitle, rate: m.averageAttendanceRate };
        if (m.averageAttendanceRate < worstMonthByRate.rate) worstMonthByRate = { label: m.monthTitle, rate: m.averageAttendanceRate };
    });

    let bestSundayInQuarter = { label: 'None', count: -1, rate: 0 };
    let worstSundayInQuarter = { label: 'None', count: 99999, rate: 100 };
    monthlyCards.forEach(m => {
        m.dailyCards.forEach(d => {
            if (d.status === 'Completed' || d.status === 'Ongoing') {
                if (d.present > bestSundayInQuarter.count) bestSundayInQuarter = { label: formatDateLabel(d.date), count: d.present, rate: d.attendanceRate };
                if (d.present < worstSundayInQuarter.count) worstSundayInQuarter = { label: formatDateLabel(d.date), count: d.present, rate: d.attendanceRate };
            }
        });
    });

    const activeMembersList = members.filter(m => !m.is_deleted);
    const avgRetentionQuarter = activeMembersList.length > 0
        ? Number((monthlyCards.reduce((acc, m) => acc + m.retentionRate3PlusSundays, 0) / (monthlyCards.length || 1)).toFixed(1))
        : 0;

    let qoqComparison = { membersDiffPercent: 0, attendanceRateDiff: 0, visitorsDiff: 0, newMembersDiff: 0, verdict: 'First quarter.' };
    if (previousQuarter) {
        const rateDiff = Number((averageAttendanceRateQuarter - previousQuarter.averageAttendanceRateQuarter).toFixed(1));
        qoqComparison = {
            membersDiffPercent: Number((quarterGrowthRate - previousQuarter.quarterGrowthRate).toFixed(1)),
            attendanceRateDiff: rateDiff,
            visitorsDiff: uniqueVisitorsQuarter - previousQuarter.uniqueVisitorsQuarter,
            newMembersDiff: totalNewMembersQuarter - previousQuarter.totalNewMembersQuarter,
            verdict: rateDiff >= 0 ? `Better than last quarter by +${rateDiff}% attendance rate` : `Lower than last quarter`,
        };
    }

    return {
        quarterKey,
        quarterTitle,
        monthlyCards,
        totalMembersStart,
        totalMembersEnd,
        quarterGrowthRate,
        averageAttendanceRateQuarter,
        averagePresentQuarter,
        totalVisitorVisitsQuarter,
        uniqueVisitorsQuarter,
        totalNewMembersQuarter,
        quarterVisitorConversion,
        repeatVisitorRateQuarter,
        bestMonthByRate,
        worstMonthByRate,
        bestSundayInQuarter,
        worstSundayInQuarter,
        retentionQuarter: avgRetentionQuarter,
        status,
        qoqComparison,
    };
}

export function computeYearlyMetrics(
    yearKey: string,
    yearTitle: string,
    quarters: QuarterlyMetrics[],
    members: any[],
    attendance: any[],
    guestAttendance: any[],
    previousYear?: YearlyMetrics
): YearlyMetrics {
    const activeMembersList = members.filter(m => !m.is_deleted);
    const membersStartOfYear = quarters[0]?.totalMembersStart || activeMembersList.length;
    const membersEndOfYear = activeMembersList.length;
    const yearlyGrowthRate = membersStartOfYear > 0 ? Number((((membersEndOfYear - membersStartOfYear) / membersStartOfYear) * 100).toFixed(1)) : 0;

    const averageAttendanceRateYear = quarters.length > 0 ? Number((quarters.reduce((acc, q) => acc + q.averageAttendanceRateQuarter, 0) / quarters.length).toFixed(1)) : 0;
    const averagePresentYear = quarters.length > 0 ? Number((quarters.reduce((acc, q) => acc + q.averagePresentQuarter, 0) / quarters.length).toFixed(1)) : 0;

    const totalVisitorVisitsYear = quarters.reduce((acc, q) => acc + q.totalVisitorVisitsQuarter, 0);
    const uniqueVisitorsYear = new Set(guestAttendance.map(g => g.guest_id)).size;
    const totalNewMembersYear = quarters.reduce((acc, q) => acc + q.totalNewMembersQuarter, 0);
    const yearlyVisitorConversion = uniqueVisitorsYear > 0 ? Number(((totalNewMembersYear / uniqueVisitorsYear) * 100).toFixed(1)) : 0;

    const yearlyGuestCounts: Record<string, number> = {};
    guestAttendance.forEach(g => {
        yearlyGuestCounts[g.guest_id] = (yearlyGuestCounts[g.guest_id] || 0) + 1;
    });
    const repeatGuestsYearCount = Object.values(yearlyGuestCounts).filter(count => count >= 3).length;
    const repeatVisitorRateYear = uniqueVisitorsYear > 0 ? Number(((repeatGuestsYearCount / uniqueVisitorsYear) * 100).toFixed(1)) : 0;

    let bestQuarterByRate = { label: 'None', rate: -1 };
    let worstQuarterByRate = { label: 'None', rate: 101 };
    quarters.forEach(q => {
        if (q.averageAttendanceRateQuarter > bestQuarterByRate.rate) bestQuarterByRate = { label: q.quarterTitle, rate: q.averageAttendanceRateQuarter };
        if (q.averageAttendanceRateQuarter < worstQuarterByRate.rate) worstQuarterByRate = { label: q.quarterTitle, rate: q.averageAttendanceRateQuarter };
    });

    let bestSundayInYear = { label: 'None', count: -1 };
    let bestMonthByAttendance = { label: 'None', attendance: -1 };
    quarters.forEach(q => {
        q.monthlyCards.forEach(m => {
            if (m.averagePresent > bestMonthByAttendance.attendance) bestMonthByAttendance = { label: m.monthTitle, attendance: m.averagePresent };
            m.dailyCards.forEach(d => {
                if ((d.status === 'Completed' || d.status === 'Ongoing') && d.present > bestSundayInYear.count) {
                    bestSundayInYear = { label: formatDateLabel(d.date), count: d.present };
                }
            });
        });
    });

    const totalSundaysInYear = quarters.reduce((acc, q) => acc + q.monthlyCards.reduce((mAcc, m) => mAcc + m.completedSundaysCount, 0), 0);
    const memberYearlyAttendanceMap: Record<string, number> = {};
    activeMembersList.forEach(m => { memberYearlyAttendanceMap[m.id] = 0; });
    attendance.forEach(a => { if (memberYearlyAttendanceMap[a.user_id] !== undefined) memberYearlyAttendanceMap[a.user_id]++; });

    const mostConsistentMembers = activeMembersList.filter(m => totalSundaysInYear > 0 && (memberYearlyAttendanceMap[m.id] / totalSundaysInYear) >= 0.9);
    const atRiskYearlyMembers = activeMembersList.filter(m => totalSundaysInYear > 0 && (memberYearlyAttendanceMap[m.id] / totalSundaysInYear) < 0.3);
    const turnoverRate = membersStartOfYear > 0 ? Number(((members.filter(m => m.is_deleted).length / membersStartOfYear) * 100).toFixed(1)) : 0;

    let yoyComparison = { attendanceRateDiff: 0, growthDiff: 0, visitorsDiff: 0, newMembersDiff: 0, verdict: 'First year.' };
    if (previousYear) {
        const rateDiff = Number((averageAttendanceRateYear - previousYear.averageAttendanceRateYear).toFixed(1));
        yoyComparison = {
            attendanceRateDiff: rateDiff,
            growthDiff: Number((yearlyGrowthRate - previousYear.yearlyGrowthRate).toFixed(1)),
            visitorsDiff: uniqueVisitorsYear - previousYear.uniqueVisitorsYear,
            newMembersDiff: totalNewMembersYear - previousYear.totalNewMembersYear,
            verdict: rateDiff >= 0 ? `This year is Better than last year overall (+${rateDiff}% attendance)` : `Lower than last year`,
        };
    }

    return {
        yearKey,
        yearTitle,
        quarterlyCards: quarters,
        membersStartOfYear,
        membersEndOfYear,
        yearlyGrowthRate,
        averageAttendanceRateYear,
        averagePresentYear,
        totalVisitorVisitsYear,
        uniqueVisitorsYear,
        totalNewMembersYear,
        yearlyVisitorConversion,
        repeatVisitorRateYear,
        bestQuarterByRate,
        worstQuarterByRate,
        bestSundayInYear,
        bestMonthInYear: bestMonthByAttendance.label,
        mostConsistentMembers,
        atRiskYearlyMembers,
        turnoverRate,
        yoyComparison,
    };
}