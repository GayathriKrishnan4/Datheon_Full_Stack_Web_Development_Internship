
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const dueDateInput = document.getElementById("dueDateInput");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");

let tasks = JSON.parse(localStorage.getItem("taskflowTasks")) || [];
let currentFilter = "all";

// Display today's date
document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

// Save tasks in local storage
function saveTasks() {
    localStorage.setItem("taskflowTasks", JSON.stringify(tasks));
}

// Add a new task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskInput.value.trim();
    const category = categoryInput.value;
    const dueDate = dueDateInput.value;

    if (!title || !dueDate) {
        alert("Please enter a task and select a due date.");
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        title: title,
        category: category,
        dueDate: dueDate,
        completed: false
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();

    taskForm.reset();
});

// Display tasks
function renderTasks() {
    taskList.innerHTML = "";

    const searchText = searchInput.value.toLowerCase();

    let filteredTasks = tasks.filter(function(task) {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesSearch = task.title.toLowerCase().includes(searchText);

        return matchesFilter && matchesSearch;
    });

    filteredTasks.forEach(function(task) {
        const taskElement = document.createElement("div");
        taskElement.className = "task-item" + (task.completed ? " completed" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Mark task as completed");

        checkbox.addEventListener("change", function() {
            toggleTask(task.id);
        });

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const category = document.createElement("span");
        category.className = "category";
        category.textContent = task.category;

        const date = document.createElement("span");
        date.textContent = "Due: " + new Date(task.dueDate + "T00:00:00")
            .toLocaleDateString("en-IN");

        meta.appendChild(category);
        meta.appendChild(date);

        details.appendChild(title);
        details.appendChild(meta);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", "Delete " + task.title);

        deleteButton.addEventListener("click", function() {
            deleteTask(task.id);
        });

        taskElement.appendChild(checkbox);
        taskElement.appendChild(details);
        taskElement.appendChild(deleteButton);

        taskList.appendChild(taskElement);
    });

    // Update empty message
    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    if (tasks.length === 0) {
        emptyMessage.textContent = "No tasks here yet. Add a task to get started!";
    } else if (filteredTasks.length === 0) {
        emptyMessage.textContent = "No matching tasks found.";
    }

    updateStatistics();
}

// Mark a task as completed or active
function toggleTask(id) {
    tasks = tasks.map(function(task) {
        if (task.id === id) {
            task.completed = !task.completed;
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(function(task) {
        return task.id !== id;
    });

    saveTasks();
    renderTasks();
}

// Update dashboard statistics
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("activeCount").textContent = active;
    document.getElementById("completedCount").textContent = completed;

    document.getElementById("taskSummary").textContent =
        total + (total === 1 ? " task" : " tasks");
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(function(button) {
    button.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn").forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        renderTasks();
    });
});

// Search tasks
searchInput.addEventListener("input", renderTasks);

// Set minimum due date to today
const today = new Date();
const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dueDateInput.min = localToday;

// Load saved tasks when the page opens
renderTasks();
