class ProjectState {
    private readonly listeners: any[] = [];
    private readonly projects: any[] = [];
    private static instance: ProjectState;

    private constructor(){}

    static getInstance() {
        if(this.instance) {
            return this.instance
        }

        this.instance = new ProjectState()

        return this.instance;
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, people: number) {
        const newProject = {
            id: Math.random().toString(),
            title,
            description,
            people
        }

        this.projects.push(newProject);

        for(const listenerFn of this.listeners) {
            listenerFn(this.projects.slice())
        }
    }

}

const projectState = ProjectState.getInstance();

interface Validatable {
    value?: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;

    const stringValue = validatableInput.value?.toString() || "";

    if (validatableInput.required) {
        isValid = isValid && stringValue.trim().length !== 0;
    }

    if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && stringValue.length > validatableInput.minLength
    }

    if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
        isValid = isValid && stringValue.length > validatableInput.maxLength
    }

    if (validatableInput.min != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value >= validatableInput.min
    }

    if (validatableInput.max != null && typeof validatableInput.value === "number") {
        isValid = isValid && validatableInput.value <= validatableInput.max
    }

    return isValid;
}

function autoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);

            return boundFn;
        }
    }

    return adjDescriptor;
}

class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: any[];

    constructor(private readonly type: 'active' | 'finished') {
        this.templateElement = document.getElementById("project-list")! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;
        this.assignedProjects = [];
        
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`

        projectState.addListener((projects: any) => {
            this.assignedProjects = projects;
            this.renderProjects()
        })

        this.attach();
        this.renderContent()
    }

    private renderProjects(){
        const listId = `${this.type}-projects-list`;
        const listEl = document.getElementById(listId)! as HTMLUListElement;

        for(const project of this.assignedProjects) {
            const listItem = document.createElement("li");
            listItem.textContent = project.title;
            listEl.appendChild(listItem)
        }
    }

    private renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS"
    }

    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element)
    }
}

class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = "user-input"

        this.titleInputElement = this.element.querySelector("#title")!;
        this.descriptionInputElement = this.element.querySelector("#description")!;
        this.peopleInputElement = this.element.querySelector("#people")!;

        this.configure();
        this.attach();
    }

    private gatherUserInput(): [string, string, number] | void {
        const title = this.titleInputElement.value;
        const description = this.descriptionInputElement.value;
        const people = this.peopleInputElement.value;

        const titleValidation: Validatable = {
            value: title,
            required: true,
        }

        const descriptionValidation: Validatable = {
            value: description,
            required: true,
            minLength: 5,
        }

        const peopleValidation: Validatable = {
            value: +people,
            required: true,
            min: 1,
            max: 5,
        }

        if (!validate(titleValidation) || !validate(descriptionValidation) || !validate(peopleValidation)) {
            alert("Invalid input, please try again")
            return
        }


        return [title, description, +people];
    }

    private clearInputs() {
        this.titleInputElement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }

    @autoBind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();

        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;

            projectState.addProject(title, description, people)

            this.clearInputs()
        }
    }

    private configure() {
        this.element.addEventListener("submit", this.submitHandler)
    }

    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");