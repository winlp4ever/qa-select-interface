// import react
import React, { Component, useState } from 'react';

// import style file
import './_app.scss';

// import other cpns

// import 3rd party libs
import $ from 'jquery';

class Question extends Component {
    state = {}

    componentDidMount() {

    }

    render() {
        /**
         * Rendering function
         */
        return <div className='question'>
            <span>{this.props.question.question_text}</span>
            <span>{this.props.question.question_teacher_manual_review? 'reviewed': 'not reviewed'}</span>
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
        console.log(data.questions)
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