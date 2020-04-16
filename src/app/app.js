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
import HelpTwoToneIcon from '@material-ui/icons/HelpTwoTone';
import BarChartRoundedIcon from '@material-ui/icons/BarChartRounded';
import GamesRoundedIcon from '@material-ui/icons/GamesRounded';
import TripOriginRoundedIcon from '@material-ui/icons/TripOriginRounded';
import ThumbsUpDownRoundedIcon from '@material-ui/icons/ThumbsUpDownRounded';
import FiberManualRecordRoundedIcon from '@material-ui/icons/FiberManualRecordRounded';
import FiberManualRecordOutlinedIcon from '@material-ui/icons/FiberManualRecordOutlined';
import StarHalfRoundedIcon from '@material-ui/icons/StarHalfRounded';
import ClearRoundedIcon from '@material-ui/icons/ClearRounded';

const Levels = ['Master1', 'Licence3', 'Master2'];

const Answer = (props) => {
    const [editAns, setEditAns] = useState(false);
    const [editLv, setEditLv] = useState(false);
    
    const toggleEditLv = () => setEditLv(!editLv);
    const toggleEditAns = () => setEditAns(!editAns);

    const handleChangeAns = (e) => {
        props.save(props.aid, e.target.value);
    }

    const chooseLevel = (s) => {
        props.modifyLv(props.aid, s);
        toggleEditLv();
    }

    return <div className='answer'>
        <Button 
            className='del' 
            onClick={props.del}
        >
            <HighlightOffRoundedIcon/>
        </Button>
        <div className='Supp Lv'>
            <span className='title'><BarChartRoundedIcon/></span>
            {editLv?<div className='levels'>
                {Levels.map((l, id) => <span key={id} className='lv-choice'onClick={_ => chooseLevel(l)}>{l}</span>)}
                <span onClick={toggleEditLv}><ClearRoundedIcon/></span>
            </div> 
            :<span className='lv' onClick={toggleEditLv}>{props.answer.answer_level}</span>}
        </div>
        <div className='Supp Orientation'>
            <span className='title'><GamesRoundedIcon/></span>
            <span className='lv'>{props.answer.answer_orientation}</span>
        </div>
        {props.answer.source? <div className='Supp Origin'>
            <span className='title'><TripOriginRoundedIcon/></span>
            <span className='lv'>{props.answer.source}</span>
        </div>: null}
        <div className='Ans'>
            <span className='ttle'>Answer:</span>
            {
                editAns? <TextareaAutosize
                    className='ans'
                    onChange={handleChangeAns}
                    defaultValue={props.answer.answer_text}
                    onBlur={toggleEditAns}
                />: <div 
                    className='ans' 
                    onDoubleClick={toggleEditAns}
                >
                    {props.answer.answer_text}
                </div>
            }
        </div>
        
    </div>
}

class Question extends Component {
    state = {
        displayAnswers: false,
        answers: [],
        rating: this.props.question.question_rating
    }

    componentDidMount() {

    }

    rateThisQuestion = (score) => {
        this.setState({rating: score});
    }

    
    toggleDisplayAns = async () => {
        if (!this.state.displayAnswers) {
            let response = await fetch('/post-answers', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: this.props.question.question_text,
                    id: this.props.question.id
                })
            });
            let data = await response.json();
            console.log(data);
            this.setState({answers: data.answers});
        }
        this.setState({displayAnswers: !this.state.displayAnswers});
    }

    deleteAnswer = (id) => {
        let as = this.state.answers.slice();
        as.splice(id, 1);
        this.setState({answers: as});
    }

    saveAnswerModifs = (id, a) => {
        this.state.answers[id].answer_text = a;
        
    }

    saveAnswerLv = (id, l) => {
        this.state.answers[id].answer_level = l;
    }

    saveToDb = async () => {
        let response = await fetch('/submit-answers', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: this.props.question,
                answers: this.state.answers,
                rating: this.state.rating
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
        return <div className={'question' + (this.state.displayAnswers? ' show-answers': '')}>
            <div className='q'>
                <span className='help'><HelpTwoToneIcon/></span>
                <span>{this.props.question.question_text}</span>
                <Button className='modify-answers' onClick={this.toggleDisplayAns}><EditRoundedIcon/></Button>
            </div>
            {this.state.displayAnswers? <div className='as'>
                <div className='q-review'>
                    <div className='rate'>
                        <span className='vote-icon'><StarHalfRoundedIcon/></span>
                        <span>
                        {[1, 2, 3, 4, 5].map(i => {
                            if (i <= this.state.rating) 
                                return <FiberManualRecordRoundedIcon key={i} onClick={_ => this.rateThisQuestion(i)}/>
                            return <FiberManualRecordOutlinedIcon key={i} onClick={_ => this.rateThisQuestion(i)} />
                        })}
                        </span>
                        <span className='vote-urge'>Vote this question!</span>
                    </div>
                </div>
                {this.state.answers.map((a, id) => <Answer 
                    answer={a} 
                    key={id} 
                    save={this.saveAnswerModifs} 
                    modifyLv={this.saveAnswerLv}
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
        console.log(data);
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
                {this.state.questions.map((q, _) => <Question 
                    key={q.id} 
                    question={q} 
                    rateQuestion={this.rateQuestion}
                />)}
            </div>
        </div>
    }
}