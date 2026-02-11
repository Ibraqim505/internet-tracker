// Глобальные переменные
let currentQuestion = 1;
let testScore = 0;
let weekData = [];
let currentChart = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initTracker();
    initTest();
    initStats();
    loadSavedData();
    updateHeroStats();
});

// === НАВИГАЦИЯ ===
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Убираем активный класс у всех ссылок
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            this.classList.add('active');
            
            // Плавный скролл к секции
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// === УЧЁТ ВРЕМЕНИ ===
function initTracker() {
    const saveButton = document.getElementById('saveTime');
    const inputs = document.querySelectorAll('.time-field');
    
    // Обновление итогов при вводе
    inputs.forEach(input => {
        input.addEventListener('input', updateActivityTotals);
    });
    
    // Сохранение данных
    saveButton.addEventListener('click', saveTimeData);
}

function updateActivityTotals() {
    const activities = ['social', 'games', 'video', 'study'];
    
    activities.forEach(activity => {
        const hours = parseInt(document.getElementById(`${activity}-hours`).value) || 0;
        const minutes = parseInt(document.getElementById(`${activity}-minutes`).value) || 0;
        const total = hours * 60 + minutes;
        
        document.getElementById(`${activity}-total`).textContent = `${total}м`;
    });
    
    updateRecommendations();
}

function saveTimeData() {
    const today = new Date().toISOString().split('T')[0];
    const activities = ['social', 'games', 'video', 'study'];
    
    let dayData = {
        date: today,
        activities: {}
    };
    
    let totalMinutes = 0;
    
    activities.forEach(activity => {
        const hours = parseInt(document.getElementById(`${activity}-hours`).value) || 0;
        const minutes = parseInt(document.getElementById(`${activity}-minutes`).value) || 0;
        const total = hours * 60 + minutes;
        
        dayData.activities[activity] = total;
        totalMinutes += total;
    });
    
    dayData.total = totalMinutes;
    
    // Сохранение в localStorage
    let savedData = JSON.parse(localStorage.getItem('screenTimeData')) || [];
    
    // Проверяем, есть ли уже данные за сегодня
    const todayIndex = savedData.findIndex(d => d.date === today);
    
    if (todayIndex !== -1) {
        savedData[todayIndex] = dayData;
    } else {
        savedData.push(dayData);
    }
    
    // Оставляем только последние 30 дней
    if (savedData.length > 30) {
        savedData = savedData.slice(-30);
    }
    
    localStorage.setItem('screenTimeData', JSON.stringify(savedData));
    
    showNotification('Данные успешно сохранены!', 'success');
    updateHeroStats();
    updateStatsChart();
}

function updateRecommendations() {
    const activities = ['social', 'games', 'video', 'study'];
    let totalMinutes = 0;
    
    activities.forEach(activity => {
        const hours = parseInt(document.getElementById(`${activity}-hours`).value) || 0;
        const minutes = parseInt(document.getElementById(`${activity}-minutes`).value) || 0;
        totalMinutes += (hours * 60 + minutes);
    });
    
    const recommendationText = document.getElementById('recommendationText');
    
    if (totalMinutes === 0) {
        recommendationText.innerHTML = 'Начни отслеживать своё время, чтобы получить персональные рекомендации.';
    } else if (totalMinutes < 120) {
        recommendationText.innerHTML = '<strong>Отлично!</strong> Ты контролируешь своё экранное время. Продолжай в том же духе! Не забывай делать перерывы каждый час.';
    } else if (totalMinutes < 240) {
        recommendationText.innerHTML = '<strong>Хорошо!</strong> Твоё время в пределах нормы, но помни о балансе. Рекомендуем делать 10-минутные перерывы каждый час и заниматься офлайн-активностями.';
    } else if (totalMinutes < 360) {
        recommendationText.innerHTML = '<strong>Внимание!</strong> Ты проводишь довольно много времени за экраном. Попробуй установить лимиты для приложений и больше времени проводить с друзьями вживую.';
    } else {
        recommendationText.innerHTML = '<strong>Тревожный сигнал!</strong> Слишком много экранного времени может навредить здоровью. Рекомендуем: установить строгие лимиты, заняться спортом, больше общаться офлайн.';
    }
}

// === СТАТИСТИКА ===
function initStats() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.dataset.period;
            updateStatsChart(period);
        });
    });
    
    updateStatsChart('week');
}

function updateStatsChart(period = 'week') {
    const savedData = JSON.parse(localStorage.getItem('screenTimeData')) || [];
    
    if (savedData.length === 0) {
        // Демо данные для примера
        savedData.push(...generateDemoData());
    }
    
    const days = period === 'week' ? 7 : 30;
    const recentData = savedData.slice(-days);
    
    const labels = recentData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const totalData = recentData.map(d => Math.round(d.total / 60 * 10) / 10);
    const socialData = recentData.map(d => Math.round((d.activities.social || 0) / 60 * 10) / 10);
    const gamesData = recentData.map(d => Math.round((d.activities.games || 0) / 60 * 10) / 10);
    const videoData = recentData.map(d => Math.round((d.activities.video || 0) / 60 * 10) / 10);
    
    const ctx = document.getElementById('weekChart').getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Общее время',
                    data: totalData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Соцсети',
                    data: socialData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Игры',
                    data: gamesData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Видео',
                    data: videoData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: period === 'week' ? 'Экранное время за неделю (часы)' : 'Экранное время за месяц (часы)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Часы'
                    }
                }
            }
        }
    });
    
    // Обновление статистических карточек
    updateStatsCards(recentData);
}

function updateStatsCards(data) {
    if (data.length === 0) return;
    
    // Самый активный день
    let maxDay = data[0];
    data.forEach(d => {
        if (d.total > maxDay.total) maxDay = d;
    });
    
    const maxDate = new Date(maxDay.date);
    document.getElementById('mostActiveDay').textContent = 
        maxDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    
    // Общее время за период
    const totalMinutes = data.reduce((sum, d) => sum + d.total, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    document.getElementById('weekTotal').textContent = `${hours}ч ${minutes}м`;
    
    // Популярная активность
    let activityTotals = { social: 0, games: 0, video: 0, study: 0 };
    data.forEach(d => {
        Object.keys(d.activities).forEach(activity => {
            activityTotals[activity] += d.activities[activity];
        });
    });
    
    const activityNames = {
        social: 'Соцсети',
        games: 'Игры',
        video: 'Видео',
        study: 'Обучение'
    };
    
    let topActivity = 'social';
    Object.keys(activityTotals).forEach(activity => {
        if (activityTotals[activity] > activityTotals[topActivity]) {
            topActivity = activity;
        }
    });
    
    document.getElementById('topActivity').textContent = activityNames[topActivity];
}

function generateDemoData() {
    const demoData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        demoData.push({
            date: date.toISOString().split('T')[0],
            total: Math.floor(Math.random() * 300) + 120,
            activities: {
                social: Math.floor(Math.random() * 120) + 30,
                games: Math.floor(Math.random() * 90) + 20,
                video: Math.floor(Math.random() * 100) + 40,
                study: Math.floor(Math.random() * 60) + 20
            }
        });
    }
    
    return demoData;
}

// === ТЕСТ ===
function initTest() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const retakeBtn = document.getElementById('retakeTest');
    
    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrevious);
    retakeBtn.addEventListener('click', resetTest);
}

function handleNext() {
    const currentQuestionEl = document.getElementById(`question${currentQuestion}`);
    const selectedAnswer = document.querySelector(`input[name="q${currentQuestion}"]:checked`);
    
    if (!selectedAnswer && currentQuestion <= 5) {
        showNotification('Пожалуйста, выбери ответ', 'warning');
        return;
    }
    
    if (selectedAnswer) {
        testScore += parseInt(selectedAnswer.value);
    }
    
    if (currentQuestion < 5) {
        currentQuestionEl.classList.add('hidden');
        currentQuestion++;
        document.getElementById(`question${currentQuestion}`).classList.remove('hidden');
        
        document.getElementById('prevBtn').style.display = 'inline-block';
        
        if (currentQuestion === 5) {
            document.getElementById('nextBtn').textContent = 'Завершить тест';
        }
    } else {
        // Показать результаты
        showTestResults();
    }
}

function handlePrevious() {
    if (currentQuestion > 1) {
        document.getElementById(`question${currentQuestion}`).classList.add('hidden');
        currentQuestion--;
        document.getElementById(`question${currentQuestion}`).classList.remove('hidden');
        
        document.getElementById('nextBtn').textContent = 'Далее';
        
        if (currentQuestion === 1) {
            document.getElementById('prevBtn').style.display = 'none';
        }
    }
}

function showTestResults() {
    document.getElementById(`question${currentQuestion}`).classList.add('hidden');
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('prevBtn').style.display = 'none';
    
    const resultEl = document.getElementById('testResult');
    const scoreEl = document.getElementById('resultScore');
    const textEl = document.getElementById('resultText');
    
    let resultText, resultClass;
    
    if (testScore <= 5) {
        resultClass = 'low';
        scoreEl.textContent = 'Низкий уровень зависимости';
        resultText = 'Отлично! Ты контролируешь своё использование гаджетов и интернета. Продолжай придерживаться здоровых цифровых привычек. Помни о перерывах и балансе между онлайн и офлайн активностями.';
    } else if (testScore <= 10) {
        resultClass = 'medium';
        scoreEl.textContent = 'Средний уровень зависимости';
        resultText = 'Будь внимателен! У тебя есть некоторые признаки зависимости от гаджетов. Рекомендуем: установить лимиты времени для приложений, делать регулярные перерывы, больше заниматься офлайн-активностями (спорт, хобби, встречи с друзьями).';
    } else {
        resultClass = 'high';
        scoreEl.textContent = 'Высокий уровень зависимости';
        resultText = 'Важно! Результаты теста показывают высокую зависимость от гаджетов. Это может негативно влиять на здоровье, учёбу и отношения. Советуем: поговорить с родителями или школьным психологом, установить строгие ограничения на использование устройств, найти интересные офлайн-занятия. Твоё здоровье важнее лайков!';
    }
    
    scoreEl.className = `result-score ${resultClass}`;
    textEl.textContent = resultText;
    resultEl.classList.remove('hidden');
}

function resetTest() {
    currentQuestion = 1;
    testScore = 0;
    
    // Сброс всех ответов
    for (let i = 1; i <= 5; i++) {
        const inputs = document.querySelectorAll(`input[name="q${i}"]`);
        inputs.forEach(input => input.checked = false);
    }
    
    // Скрыть результаты
    document.getElementById('testResult').classList.add('hidden');
    
    // Показать первый вопрос
    document.getElementById('question1').classList.remove('hidden');
    
    // Восстановить кнопки
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').textContent = 'Далее';
    document.getElementById('prevBtn').style.display = 'none';
}

// === ОБНОВЛЕНИЕ СТАТИСТИКИ НА ГЛАВНОЙ ===
function updateHeroStats() {
    const savedData = JSON.parse(localStorage.getItem('screenTimeData')) || [];
    
    if (savedData.length === 0) {
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = savedData.find(d => d.date === today);
    
    // Сегодня онлайн
    if (todayData) {
        const hours = Math.floor(todayData.total / 60);
        const minutes = todayData.total % 60;
        document.getElementById('todayTotal').textContent = `${hours}ч ${minutes}м`;
    }
    
    // Среднее за неделю
    const weekData = savedData.slice(-7);
    if (weekData.length > 0) {
        const avgMinutes = Math.floor(
            weekData.reduce((sum, d) => sum + d.total, 0) / weekData.length
        );
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;
        document.getElementById('weekAverage').textContent = `${hours}ч ${minutes}м`;
    }
    
    // Баланс (процент здорового использования)
    if (todayData) {
        const recommendedMax = 180; // 3 часа рекомендуется
        const balance = Math.max(0, Math.min(100, 
            Math.round((1 - todayData.total / (recommendedMax * 2)) * 100)
        ));
        document.getElementById('balanceScore').textContent = `${balance}%`;
    }
}

// === ЗАГРУЗКА СОХРАНЁННЫХ ДАННЫХ ===
function loadSavedData() {
    const today = new Date().toISOString().split('T')[0];
    const savedData = JSON.parse(localStorage.getItem('screenTimeData')) || [];
    const todayData = savedData.find(d => d.date === today);
    
    if (todayData) {
        const activities = ['social', 'games', 'video', 'study'];
        activities.forEach(activity => {
            const minutes = todayData.activities[activity] || 0;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            document.getElementById(`${activity}-hours`).value = hours;
            document.getElementById(`${activity}-minutes`).value = mins;
        });
        
        updateActivityTotals();
    }
}

// === УВЕДОМЛЕНИЯ ===
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

