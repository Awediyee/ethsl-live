import { useEffect, useState } from 'react'
import './AnalyticsCard.css'

function AnalyticsCard({ title, value, icon, trend, trendValue, color = 'primary', loading = false }) {
    const [displayValue, setDisplayValue] = useState(0)

    // Animated counter effect
    useEffect(() => {
        if (loading || !value) return

        const duration = 1000 // 1 second animation
        const steps = 60
        const increment = value / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= value) {
                setDisplayValue(value)
                clearInterval(timer)
            } else {
                setDisplayValue(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [value, loading])

    return (
        <div className={`analytics-card analytics-card-${color}`}>
            <div className="analytics-card-header">
                <div className="analytics-card-icon-wrapper">
                    <span className="analytics-card-icon">{icon}</span>
                </div>
                {trend && (
                    <div className={`analytics-card-trend trend-${trend}`}>
                        <span className="trend-arrow">{trend === 'up' ? '↑' : '↓'}</span>
                        <span className="trend-value">{trendValue}%</span>
                    </div>
                )}
            </div>

            <div className="analytics-card-body">
                <h3 className="analytics-card-title">{title}</h3>
                <div className="analytics-card-value">
                    {loading ? (
                        <div className="analytics-card-skeleton"></div>
                    ) : (
                        <span>{displayValue.toLocaleString()}</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnalyticsCard
