'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { getStartOfTodayUTC, formatDateKeyUTC, dateFromUTC } from '@/lib/date-utils'
import type { DayStats } from '@/model/calendar'

// Start of current month in UTC for initial state
function getInitialMonthUTC() {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1, 0, 0, 0, 0))
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(getInitialMonthUTC)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [stats, setStats] = useState<Record<string, DayStats>>({})

  useEffect(() => {
    fetchStats()
  }, [currentDate])

  const fetchStats = async () => {
    setIsLoadingStats(true)
    try {
      const y = currentDate.getUTCFullYear()
      const m = currentDate.getUTCMonth()
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`
      const response = await fetch(`/api/calendar/stats?month=${monthStr}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const y = currentDate.getUTCFullYear()
  const m = currentDate.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const firstDayOfMonth = new Date(Date.UTC(y, m, 1)).getUTCDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const prevMonth = () => {
    setCurrentDate(new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0)))
  }

  const todayStart = useMemo(() => getStartOfTodayUTC(), [])

  const isPastDay = (day: number) => {
    const dayStart = dateFromUTC(y, m, day)
    return dayStart < todayStart
  }

  const isToday = (day: number) =>
    day === todayStart.getUTCDate() &&
    m === todayStart.getUTCMonth() &&
    y === todayStart.getUTCFullYear()

  // Generate calendar days
  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const getDayKey = (day: number) => formatDateKeyUTC(dateFromUTC(y, m, day))

  const upcomingJobs = useMemo(() => {
    return Object.values(stats)
      .flatMap(s => s.jobs)
      .filter(job => job.status !== 'COMPLETED' && job.status !== 'DELIVERED')
      .slice(0, 5)
  }, [stats])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your production schedule
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {monthNames[currentDate.getUTCMonth()]} {currentDate.getUTCFullYear()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayKey = day ? getDayKey(day) : ''
                  const dayStats = day ? stats[dayKey] : null
                  const isPast = day ? isPastDay(day) : false

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                          min-h-[100px] p-2 border rounded-lg transition-colors
                          ${day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                          ${day && isToday(day) ? 'border-indigo-500 border-2' : 'border-gray-200'}
                          ${isPast ? 'opacity-50 grayscale-[0.5]' : ''}
                          ${dayStats?.hasOverdue ? 'bg-red-50 border-red-200' : ''}
                        `}
                        >
                          {day && (
                            <div className="flex flex-col h-full">
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`
                                  text-sm font-medium
                                  ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}
                                  ${dayStats?.hasOverdue ? 'text-red-600' : ''}
                                `}
                                >
                                  {day}
                                </span>
                                {dayStats && dayStats.jobs.length > 0 && (
                                  <Badge variant={dayStats.hasOverdue ? "destructive" : "secondary"} className="text-[10px] px-1 h-4">
                                    {dayStats.jobs.length}
                                  </Badge>
                                )}
                              </div>

                              {dayStats && dayStats.jobs.length > 0 && (
                                <div className="space-y-1 overflow-hidden">
                                  {dayStats.jobs.slice(0, 2).map(job => (
                                    <div
                                      key={job.id}
                                      className={`text-[10px] truncate px-1 rounded ${job.isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}
                                    >
                                      {job.projectName}
                                    </div>
                                  ))}
                                  {dayStats.jobs.length > 2 && (
                                    <div className="text-[10px] text-gray-400 pl-1">
                                      +{dayStats.jobs.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}

                              {dayStats && dayStats.capacityMinutes > 0 && (
                                <div className="mt-auto pt-1">
                                  <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div
                                      className={`h-1 rounded-full ${dayStats.allocationPercentage > 90 ? 'bg-orange-500' : 'bg-green-500'}`}
                                      style={{ width: `${dayStats.allocationPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      {day && (
                        <TooltipContent side="top" className="w-64 p-3">
                          <div className="space-y-2">
                            <div className="font-bold border-b pb-1">
                              {format(dateFromUTC(y, m, day), 'PPP')}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-gray-500">Allocation:</div>
                              <div className="font-medium">{dayStats?.allocationPercentage || 0}%</div>
                              <div className="text-gray-500">Capacity:</div>
                              <div className="font-medium">{Math.round((dayStats?.capacityMinutes || 0) / 60)}h</div>
                              <div className="text-gray-500">Used:</div>
                              <div className="font-medium">{Math.round((dayStats?.totalMinutes || 0) / 60)}h {Math.round((dayStats?.totalMinutes || 0) % 60)}m</div>
                              <div className="text-gray-500">Remaining:</div>
                              <div className="font-medium text-green-600">{Math.round((dayStats?.remainingMinutes || 0) / 60)}h {Math.round((dayStats?.remainingMinutes || 0) % 60)}m</div>
                            </div>
                            {dayStats && dayStats.jobs.length > 0 && (
                              <div className="border-t pt-2 mt-2">
                                <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Orders Due:</div>
                                <div className="space-y-1">
                                  {dayStats.jobs.map(job => (
                                    <div key={job.id} className="flex justify-between items-center text-xs">
                                      <span className={job.isOverdue ? 'text-red-600 font-medium' : ''}>{job.orderNumber}</span>
                                      <span className="text-gray-400 truncate ml-2 flex-1">{job.projectName}</span>
                                      {job.isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 ml-1" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Upcoming
              </CardTitle>
              <CardDescription>Scheduled events and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingJobs.length > 0 ? (
                  upcomingJobs.map(job => (
                    <div key={job.id} className="flex items-start gap-3 p-2 rounded-lg border bg-white shadow-sm">
                      <div className={`mt-0.5 p-1 rounded-full ${job.isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {job.isOverdue ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium truncate ${job.isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                            {job.orderNumber}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{job.projectName}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm">No upcoming events</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Order due dates will appear here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Orders Due</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Normal Capacity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600">High Capacity (&gt;90%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Overdue Task</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
