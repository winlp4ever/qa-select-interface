// import react
import React, { Component, useState } from 'react';

// import style file
import './_app.scss';

// import other cpns

// import 3rd party libs
import $ from 'jquery';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Button from '@material-ui/core/Button';
import EditRoundedIcon from '@material-ui/icons/EditRounded';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';


const Answer = (props) => {
    const [editAns, setEditAns] = useState(false);
    
    const toggleEditAns = () => setEditAns(!editAns);

    const handleChangeAns = (e) => {
        props.save(props.aid, e.target.value);
    }

    return <div className='answer'>
        <Button onClick={props.del}><HighlightOffRoundedIcon/></Button>
        <div className='Lv'>
            <span className='title'>Level:</span>
            <span className='lv'>{props.answer.book_level}</span>
        </div>
        <div className='Ans'>
            {
                editAns? <TextareaAutosize
                    className='ans'
                    onChange={handleChangeAns}
                    defaultValue={props.answer.answer}
                    onBlur={toggleEditAns}
                />: <div 
                    className='ans' 
                    onDoubleClick={toggleEditAns}
                >
                    {props.answer.answer}
                </div>
            }
        </div>
        
    </div>
}

class Question extends Component {
    state = {
        displayAnswers: false,
        answers: []
    }

    componentDidMount() {

    }

    toggleDisplayAns = async () => {
        if (!this.state.displayAnswers) {
            let response = await fetch('/post-answers', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: this.props.question.question_text
                })
            });
            let data = await response.json();
            console.log(data);
            this.setState({answers: data.answers_es});
        }
        this.setState({displayAnswers: !this.state.displayAnswers});
    }

    deleteAnswer = (id) => {
        let as = this.state.answers.slice();
        as.splice(id, 1);
        this.setState({answers: as});
    }

    saveAnswerModifs = (id, a) => {
        this.state.answers[id].answer = a;
    }

    saveToDb = async () => {
        let response = await fetch('/submit-answers', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.props.question.id,
                question: this.props.question.question_text,
                answers: {answers: this.state.answers}
            })
        });
        let data = await response.json();
        console.log(data);
        //props.saveQAs();
    }

    render() {
        /**
         * Rendering function
         */
        let reviewed = this.props.question.question_teacher_manual_review;
        return <div className='question'>
            <div className='q'>
                <span>{this.props.question.question_text}</span>
                <Button className='modify-answers' onClick={this.toggleDisplayAns}><EditRoundedIcon/></Button>
            </div>
            {this.state.displayAnswers? <div className='as'>
                {this.state.answers.map((a, id) => <Answer 
                    answer={a} 
                    key={id} 
                    save={this.saveAnswerModifs} 
                    aid={id}
                    del={_ => this.deleteAnswer(id)}
                />)}
                <Button className='valid-modifs' onClick={this.saveToDb}>Save changes</Button>
            </div>: null}
        </div>
    }
}

export default class App extends Component {
    state = {
        questions: [],
        // questions range in the db: i = questions fr index 10*i -> 10*(i+1) exclusive
        range: 0
    }

    async componentDidMount() {
        let response = await fetch('/post-questions', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: this.state.range
            })
        });
        let data = await response.json();
        this.setState({questions: data.questions});
    }

    nextQuestions = async () => {
        let response = await fetch('/post-questions', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: this.state.range + 1
            })
        });
        let data = await response.json();
        this.setState({
            range: this.state.range+1,
            questions: data.questions
        });
    }

    render() {
        /**
         * Rendering function
         */
        return <div className='qa-select'>
            <div className='qas'>
                {this.state.questions.map((q, _) => <Question key={q.id} question={q} />)}
            </div>
        </div>
    }
}