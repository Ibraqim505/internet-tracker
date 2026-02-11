import statistics
from typing import List, Dict


class DigitalBalanceAnalyzer:
    def __init__(self):
        self.recommended_limits = {
            "social": 60,
            "games": 60,
            "video": 90,
            "study": 120,
            "total": 180
        }

    # 📅 Анализ одного дня
    def analyze_day_data(self, day_data: Dict) -> Dict:
        total_time = day_data.get("total", 0)
        activities = day_data.get("activities", {})

        balance_score = self._calculate_balance_score(total_time)
        risk_level = self._determine_risk_level(total_time)

        return {
            "total_time": total_time,
            "total_hours": round(total_time / 60, 1),
            "balance_score": balance_score,
            "risk_level": risk_level,
            "activities": activities,
            "recommendations": self._generate_recommendations(total_time)
        }

    # 📊 Анализ недели
    def analyze_week_data(self, week_data: List[Dict]) -> Dict:
        if not week_data:
            return {}

        totals = [day.get("total", 0) for day in week_data]

        avg_time = statistics.mean(totals)
        median_time = statistics.median(totals)
        total_week_time = sum(totals)

        trend = self._calculate_trend(totals)

        return {
            "average_time": round(avg_time, 1),
            "median_time": round(median_time, 1),
            "total_week_time": total_week_time,
            "total_week_hours": round(total_week_time / 60, 1),
            "trend": trend,
        }

    # 📄 Генерация отчёта
    def generate_report(self, user_data: List[Dict], period="week") -> str:
        analysis = self.analyze_week_data(user_data)

        return f"""
ОТЧЁТ ЗА {period.upper()}

Среднее время: {analysis.get("average_time", 0)} мин
Медиана: {analysis.get("median_time", 0)} мин
Всего часов: {analysis.get("total_week_hours", 0)}
Тренд: {analysis.get("trend", "нет данных")}
"""

    # 🔢 Баланс
    def _calculate_balance_score(self, total_time: int) -> int:
        limit = self.recommended_limits["total"]

        if total_time <= limit:
            return 100
        elif total_time <= limit * 1.5:
            return 70
        elif total_time <= limit * 2:
            return 40
        else:
            return 10

    # ⚠️ Уровень риска
    def _determine_risk_level(self, total_time: int) -> str:
        limit = self.recommended_limits["total"]

        if total_time <= limit:
            return "низкий"
        elif total_time <= limit * 1.5:
            return "средний"
        elif total_time <= limit * 2:
            return "высокий"
        else:
            return "критический"

    # 📈 Тренд
    def _calculate_trend(self, totals: List[int]) -> str:
        if len(totals) < 2:
            return "недостаточно данных"

        if totals[-1] > totals[0]:
            return "растёт"
        elif totals[-1] < totals[0]:
            return "снижается"
        else:
            return "стабильно"

    # 💡 Рекомендации
    def _generate_recommendations(self, total_time: int) -> List[str]:
        limit = self.recommended_limits["total"]

        if total_time > limit * 2:
            return ["🚨 Критическое превышение экранного времени"]
        elif total_time > limit:
            return ["⚠️ Стоит сократить экранное время"]
        else:
            return ["✅ Отличный цифровой баланс"]
